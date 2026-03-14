// Local variant - local.worldmonitor.app
// Hyperlocal dashboard with zone-based content prioritization
import type { PanelConfig, MapLayers } from '@/types';
import type { VariantConfig } from './base';

// Re-export base config
export * from './base';

// Local-specific exports
export {
  SOURCE_TIERS,
  getSourceTier,
  SOURCE_TYPES,
  getSourceType,
  getSourcePropagandaRisk,
  type SourceRiskProfile,
  type SourceType,
} from '../feeds';

// ═══════════════════════════════════════════════════════════════════════════
// ZONE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export interface ZoneConfig {
  id: number;
  name: string;
  radiusKm: number;
  priority: number;
  zoomLevel: number;
  keywords: string[];
}

// Default location: Jubilee Hills, Hyderabad
export const DEFAULT_COORDINATES = {
  lat: 17.43865,
  lon: 78.409022,
  name: 'Jubilee Hills',
  city: 'Hyderabad',
  state: 'Telangana',
  country: 'India',
};

// Zone definitions - expanding radius from center
export const ZONES: ZoneConfig[] = [
  {
    id: 1,
    name: 'Hyperlocal',
    radiusKm: 5,
    priority: 100,
    zoomLevel: 15,
    keywords: ['jubilee hills', 'jubilee', 'road no', 'film nagar', 'peddamma temple'],
  },
  {
    id: 2,
    name: 'Neighborhood',
    radiusKm: 15,
    priority: 80,
    zoomLevel: 13,
    keywords: ['banjara hills', 'madhapur', 'hitec city', 'hitech city', 'gachibowli', 'kondapur', 'kukatpally', 'ameerpet', 'somajiguda', 'begumpet'],
  },
  {
    id: 3,
    name: 'Metro',
    radiusKm: 50,
    priority: 60,
    zoomLevel: 11,
    keywords: ['hyderabad', 'secunderabad', 'cyberabad', 'lb nagar', 'uppal', 'dilsukhnagar', 'charminar', 'tank bund', 'hussain sagar'],
  },
  {
    id: 4,
    name: 'Regional',
    radiusKm: 200,
    priority: 40,
    zoomLevel: 9,
    keywords: ['telangana', 'warangal', 'karimnagar', 'nizamabad', 'khammam', 'nalgonda', 'medak', 'rangareddy'],
  },
  {
    id: 5,
    name: 'National',
    radiusKm: Infinity,
    priority: 20,
    zoomLevel: 5,
    keywords: ['india', 'indian', 'delhi', 'mumbai', 'bangalore', 'chennai'],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// LOCAL NEWS FEEDS
// ═══════════════════════════════════════════════════════════════════════════

import type { Feed } from '@/types';
import { rssProxyUrl } from '@/utils';

const rss = rssProxyUrl;

export const FEEDS: Record<string, Feed[]> = {
  // Telugu TV News Channels
  teluguNews: [
    { name: 'TV9 Telugu', url: rss('https://news.google.com/rss/search?q=site:tv9telugu.com+OR+"TV9+Telugu"+when:1d&hl=te&gl=IN&ceid=IN:te') },
    { name: 'Sakshi TV', url: rss('https://news.google.com/rss/search?q=site:sakshi.com+OR+"Sakshi+TV"+Hyderabad+when:1d&hl=te&gl=IN&ceid=IN:te') },
    { name: 'V6 News', url: rss('https://news.google.com/rss/search?q="V6+News"+Telangana+OR+Hyderabad+when:1d&hl=te&gl=IN&ceid=IN:te') },
    { name: 'NTV Telugu', url: rss('https://news.google.com/rss/search?q="NTV+Telugu"+OR+site:ntvtelugu.com+when:1d&hl=te&gl=IN&ceid=IN:te') },
    { name: 'ABN Telugu', url: rss('https://news.google.com/rss/search?q="ABN+Telugu"+OR+"ABN+Andhra+Jyothi"+when:1d&hl=te&gl=IN&ceid=IN:te') },
    { name: 'T News', url: rss('https://news.google.com/rss/search?q="T+News"+Telangana+when:1d&hl=te&gl=IN&ceid=IN:te') },
  ],

  // Telugu Newspapers
  teluguPapers: [
    { name: 'Eenadu', url: rss('https://news.google.com/rss/search?q=site:eenadu.net+Hyderabad+when:1d&hl=te&gl=IN&ceid=IN:te') },
    { name: 'Sakshi Paper', url: rss('https://news.google.com/rss/search?q=site:sakshi.com+Hyderabad+when:1d&hl=te&gl=IN&ceid=IN:te') },
    { name: 'Andhra Jyothi', url: rss('https://news.google.com/rss/search?q=site:andhrajyothy.com+when:1d&hl=te&gl=IN&ceid=IN:te') },
    { name: 'Namaste Telangana', url: rss('https://news.google.com/rss/search?q=site:ntnews.com+when:1d&hl=te&gl=IN&ceid=IN:te') },
  ],

  // English Local News
  localEnglish: [
    { name: 'Telangana Today', url: rss('https://telanganatoday.com/feed') },
    { name: 'Deccan Chronicle', url: rss('https://news.google.com/rss/search?q=site:deccanchronicle.com+Hyderabad+when:1d&hl=en-IN&gl=IN&ceid=IN:en') },
    { name: 'The Hindu Hyderabad', url: rss('https://news.google.com/rss/search?q=site:thehindu.com+Hyderabad+when:1d&hl=en-IN&gl=IN&ceid=IN:en') },
    { name: 'TOI Hyderabad', url: rss('https://timesofindia.indiatimes.com/rssfeeds/3947071.cms') },
    { name: 'Indian Express Hyd', url: rss('https://news.google.com/rss/search?q=site:indianexpress.com+Hyderabad+when:1d&hl=en-IN&gl=IN&ceid=IN:en') },
    { name: 'Hans India', url: rss('https://news.google.com/rss/search?q=site:thehansindia.com+Hyderabad+when:1d&hl=en-IN&gl=IN&ceid=IN:en') },
  ],

  // Hyperlocal News (Zone 1-2)
  hyperlocal: [
    { name: 'Jubilee Hills News', url: rss('https://news.google.com/rss/search?q="Jubilee+Hills"+Hyderabad+when:3d&hl=en-IN&gl=IN&ceid=IN:en') },
    { name: 'Banjara Hills News', url: rss('https://news.google.com/rss/search?q="Banjara+Hills"+Hyderabad+when:3d&hl=en-IN&gl=IN&ceid=IN:en') },
    { name: 'HITEC City News', url: rss('https://news.google.com/rss/search?q="HITEC+City"+OR+"Hi-Tech+City"+Hyderabad+when:3d&hl=en-IN&gl=IN&ceid=IN:en') },
    { name: 'Madhapur News', url: rss('https://news.google.com/rss/search?q=Madhapur+Hyderabad+when:3d&hl=en-IN&gl=IN&ceid=IN:en') },
    { name: 'Gachibowli News', url: rss('https://news.google.com/rss/search?q=Gachibowli+Hyderabad+when:3d&hl=en-IN&gl=IN&ceid=IN:en') },
  ],

  // Telangana Politics
  politics: [
    { name: 'Telangana Politics', url: rss('https://news.google.com/rss/search?q=Telangana+government+OR+KCR+OR+Revanth+Reddy+OR+"Telangana+CM"+when:2d&hl=en-IN&gl=IN&ceid=IN:en') },
    { name: 'GHMC News', url: rss('https://news.google.com/rss/search?q=GHMC+OR+"Greater+Hyderabad"+municipal+when:3d&hl=en-IN&gl=IN&ceid=IN:en') },
    { name: 'Telangana Assembly', url: rss('https://news.google.com/rss/search?q="Telangana+Assembly"+OR+"Telangana+Legislature"+when:7d&hl=en-IN&gl=IN&ceid=IN:en') },
  ],

  // IT & Business (Hyderabad Tech Hub)
  business: [
    { name: 'Hyderabad IT', url: rss('https://news.google.com/rss/search?q=Hyderabad+IT+OR+"Cyberabad"+tech+OR+startup+when:3d&hl=en-IN&gl=IN&ceid=IN:en') },
    { name: 'Hyderabad Startups', url: rss('https://news.google.com/rss/search?q=Hyderabad+startup+OR+"T-Hub"+OR+"IIIT+Hyderabad"+when:7d&hl=en-IN&gl=IN&ceid=IN:en') },
    { name: 'Pharma City', url: rss('https://news.google.com/rss/search?q=Hyderabad+pharma+OR+"Genome+Valley"+OR+biotech+when:7d&hl=en-IN&gl=IN&ceid=IN:en') },
    { name: 'Real Estate', url: rss('https://news.google.com/rss/search?q=Hyderabad+real+estate+OR+property+OR+construction+when:7d&hl=en-IN&gl=IN&ceid=IN:en') },
  ],

  // Traffic & Transport
  traffic: [
    { name: 'Hyderabad Traffic', url: rss('https://news.google.com/rss/search?q=Hyderabad+traffic+OR+"traffic+jam"+OR+"road+block"+when:1d&hl=en-IN&gl=IN&ceid=IN:en') },
    { name: 'Hyderabad Metro', url: rss('https://news.google.com/rss/search?q="Hyderabad+Metro"+OR+HMRL+when:3d&hl=en-IN&gl=IN&ceid=IN:en') },
    { name: 'TSRTC', url: rss('https://news.google.com/rss/search?q=TSRTC+OR+"Telangana+RTC"+when:3d&hl=en-IN&gl=IN&ceid=IN:en') },
    { name: 'Rajiv Gandhi Airport', url: rss('https://news.google.com/rss/search?q="Rajiv+Gandhi+Airport"+OR+"Shamshabad+Airport"+OR+RGIA+when:7d&hl=en-IN&gl=IN&ceid=IN:en') },
  ],

  // Events & Entertainment
  events: [
    { name: 'Hyderabad Events', url: rss('https://news.google.com/rss/search?q=Hyderabad+event+OR+festival+OR+concert+OR+exhibition+when:7d&hl=en-IN&gl=IN&ceid=IN:en') },
    { name: 'Tollywood', url: rss('https://news.google.com/rss/search?q=Tollywood+OR+"Telugu+cinema"+OR+"Telugu+movie"+when:2d&hl=en-IN&gl=IN&ceid=IN:en') },
    { name: 'Sports Hyderabad', url: rss('https://news.google.com/rss/search?q=Hyderabad+cricket+OR+"Sunrisers+Hyderabad"+OR+"Hyderabad+FC"+when:3d&hl=en-IN&gl=IN&ceid=IN:en') },
  ],

  // Weather & Environment
  weather: [
    { name: 'Hyderabad Weather', url: rss('https://news.google.com/rss/search?q=Hyderabad+weather+OR+rain+OR+temperature+when:1d&hl=en-IN&gl=IN&ceid=IN:en') },
    { name: 'Pollution', url: rss('https://news.google.com/rss/search?q=Hyderabad+pollution+OR+"air+quality"+OR+AQI+when:3d&hl=en-IN&gl=IN&ceid=IN:en') },
  ],

  // Crime & Safety
  crime: [
    { name: 'Hyderabad Crime', url: rss('https://news.google.com/rss/search?q=Hyderabad+crime+OR+police+OR+accident+when:1d&hl=en-IN&gl=IN&ceid=IN:en') },
    { name: 'Cyberabad Police', url: rss('https://news.google.com/rss/search?q="Cyberabad+Police"+OR+"Hyderabad+Police"+when:3d&hl=en-IN&gl=IN&ceid=IN:en') },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// PANEL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_PANELS: Record<string, PanelConfig> = {
  // Core local panels
  map: { name: 'Local Map', enabled: true, priority: 1 },
  'live-news': { name: 'Live News', enabled: true, priority: 1 },
  
  // Local news feeds (zone-prioritized)
  hyperlocal: { name: 'Hyperlocal News', enabled: true, priority: 1 },
  localEnglish: { name: 'Hyderabad News', enabled: true, priority: 1 },
  teluguNews: { name: 'Telugu TV News', enabled: true, priority: 1 },
  teluguPapers: { name: 'Telugu Papers', enabled: true, priority: 2 },
  
  // Telemetry & Environment
  weather: { name: 'Weather & Air Quality', enabled: true, priority: 1 },
  
  // Surveillance & Intelligence
  webcams: { name: 'Live Cameras', enabled: true, priority: 1 },
  shodan: { name: 'Shodan Intelligence', enabled: true, priority: 2 },
  
  // Local categories
  traffic: { name: 'Traffic & Transport', enabled: true, priority: 1 },
  politics: { name: 'Telangana Politics', enabled: true, priority: 2 },
  business: { name: 'IT & Business', enabled: true, priority: 2 },
  events: { name: 'Events & Entertainment', enabled: true, priority: 2 },
  crime: { name: 'Crime & Safety', enabled: true, priority: 2 },
  
  // Optional panels
  monitors: { name: 'My Monitors', enabled: true, priority: 2 },
};

// ═══════════════════════════════════════════════════════════════════════════
// MAP LAYERS
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_MAP_LAYERS: MapLayers = {
  // Disable global layers
  gpsJamming: false,
  conflicts: false,
  bases: false,
  cables: false,
  pipelines: false,
  hotspots: false,
  ais: false,
  nuclear: false,
  irradiators: false,
  sanctions: false,
  waterways: false,
  cyberThreats: false,
  protests: false,
  flights: false,
  military: false,
  spaceports: false,
  minerals: false,
  fires: false,
  ucdpEvents: false,
  displacement: false,
  climate: false,
  tradeRoutes: false,
  iranAttacks: false,
  ciiChoropleth: false,
  dayNight: false,
  
  // Enable local-relevant layers
  weather: true,
  economic: false,
  outages: true,
  datacenters: true,
  natural: true,
  
  // Tech layers (Hyderabad is IT hub)
  startupHubs: true,
  cloudRegions: true,
  accelerators: false,
  techHQs: true,
  techEvents: true,
  
  // Finance layers
  stockExchanges: false,
  financialCenters: false,
  centralBanks: false,
  commodityHubs: false,
  gulfInvestments: false,
  
  // Happy variant layers
  positiveEvents: false,
  kindness: false,
  happiness: false,
  speciesRecovery: false,
  renewableInstallations: false,
};

export const MOBILE_DEFAULT_MAP_LAYERS: MapLayers = {
  ...DEFAULT_MAP_LAYERS,
  weather: false,
  datacenters: false,
  startupHubs: false,
  cloudRegions: false,
  techHQs: false,
  techEvents: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// VARIANT CONFIG EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const VARIANT_CONFIG: VariantConfig = {
  name: 'local',
  description: 'Hyperlocal intelligence dashboard with zone-based content prioritization',
  panels: DEFAULT_PANELS,
  mapLayers: DEFAULT_MAP_LAYERS,
  mobileMapLayers: MOBILE_DEFAULT_MAP_LAYERS,
};
