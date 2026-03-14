// ShodanPanel - Local intelligence panel using Shodan API
// Shows device statistics, cameras, and vulnerabilities for the configured location

import {
  fetchShodanData,
  getShodanApiKey,
  isShodanConfigured,
  validateShodanApiKey,
  getShodanApiInfo,
  getDeviceIcon,
  formatPort,
  type ShodanZoneData,
  type ShodanDevice,
  type ShodanStats,
} from '@/services/shodan';
import { loadLocation } from '@/services/location';
import { escapeHtml } from '@/utils/sanitize';

export interface ShodanPanelState {
  apiKeyConfigured: boolean;
  apiKeyValid: boolean;
  apiInfo: { queryCredits: number; scanCredits: number; plan: string } | null;
  zones: ShodanZoneData[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  activeTab: 'overview' | 'devices' | 'cameras' | 'vulns';
}

export class ShodanPanel {
  private container: HTMLElement;
  private state: ShodanPanelState = {
    apiKeyConfigured: false,
    apiKeyValid: false,
    apiInfo: null,
    zones: [],
    loading: false,
    error: null,
    lastUpdate: null,
    activeTab: 'overview',
  };
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.state.apiKeyConfigured = isShodanConfigured();
    this.render();
  }

  async init(): Promise<void> {
    if (this.state.apiKeyConfigured) {
      await this.validateAndFetch();
    } else {
      this.render();
    }
    
    // Refresh every 30 minutes
    this.refreshInterval = setInterval(() => {
      if (this.state.apiKeyValid) {
        this.refresh();
      }
    }, 30 * 60 * 1000);
  }

  destroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  private async validateAndFetch(): Promise<void> {
    const apiKey = getShodanApiKey();
    if (!apiKey) {
      this.state.apiKeyConfigured = false;
      this.render();
      return;
    }
    
    this.state.loading = true;
    this.state.error = null;
    this.render();
    
    try {
      // Validate API key
      const isValid = await validateShodanApiKey(apiKey);
      this.state.apiKeyValid = isValid;
      
      if (!isValid) {
        this.state.error = 'Invalid Shodan API key in settings';
        this.state.loading = false;
        this.render();
        return;
      }
      
      // Get API info
      this.state.apiInfo = await getShodanApiInfo(apiKey);
      
      // Fetch zone data
      await this.refresh();
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to connect to Shodan';
      this.state.loading = false;
      this.render();
    }
  }

  async refresh(): Promise<void> {
    const apiKey = getShodanApiKey();
    if (!apiKey || !this.state.apiKeyValid) return;
    
    this.state.loading = true;
    this.render();
    
    try {
      this.state.zones = await fetchShodanData(apiKey, { useCache: false });
      this.state.lastUpdate = new Date();
      this.state.error = null;
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to fetch data';
    }
    
    this.state.loading = false;
    this.render();
  }

  private setActiveTab(tab: ShodanPanelState['activeTab']): void {
    this.state.activeTab = tab;
    this.render();
  }

  private getTotalStats(): ShodanStats | null {
    const allStats = this.state.zones.filter(z => z.stats).map(z => z.stats!);
    if (allStats.length === 0) return null;
    
    // Use the largest zone's stats as the total
    return allStats.reduce((a, b) => (a.total > b.total ? a : b));
  }

  private getAllDevices(): ShodanDevice[] {
    const seen = new Set<string>();
    const devices: ShodanDevice[] = [];
    
    for (const zone of this.state.zones) {
      for (const device of zone.devices) {
        const key = `${device.ip}:${device.port}`;
        if (!seen.has(key)) {
          seen.add(key);
          devices.push(device);
        }
      }
    }
    
    return devices;
  }

  private getAllCameras(): ShodanDevice[] {
    const seen = new Set<string>();
    const cameras: ShodanDevice[] = [];
    
    for (const zone of this.state.zones) {
      for (const camera of zone.cameras) {
        const key = `${camera.ip}:${camera.port}`;
        if (!seen.has(key)) {
          seen.add(key);
          cameras.push(camera);
        }
      }
    }
    
    return cameras;
  }

  private render(): void {
    const location = loadLocation();
    
    // If no API key configured, show setup message
    if (!this.state.apiKeyConfigured || !this.state.apiKeyValid) {
      this.renderSetupMessage();
      return;
    }
    
    const stats = this.getTotalStats();
    const devices = this.getAllDevices();
    const cameras = this.getAllCameras();
    
    this.container.innerHTML = `
      <div class="shodan-panel">
        <div class="shodan-header">
          <div class="shodan-title">
            <span class="shodan-icon">📡</span>
            <span>Shodan Intelligence</span>
            ${this.state.loading ? '<span class="shodan-loading">⟳</span>' : ''}
          </div>
          <div class="shodan-location">
            <span class="location-pin">📍</span>
            <span>${escapeHtml(location.name ?? 'Unknown')}</span>
          </div>
        </div>
        
        ${this.state.apiInfo ? `
          <div class="shodan-api-info">
            <span class="api-plan">${escapeHtml(this.state.apiInfo.plan)}</span>
            <span class="api-credits">${this.state.apiInfo.queryCredits} credits</span>
          </div>
        ` : ''}
        
        ${this.state.error ? `
          <div class="shodan-error">
            <span class="error-icon">⚠️</span>
            <span>${escapeHtml(this.state.error)}</span>
          </div>
        ` : ''}
        
        <div class="shodan-tabs">
          <button class="shodan-tab ${this.state.activeTab === 'overview' ? 'active' : ''}" data-tab="overview">
            Overview
          </button>
          <button class="shodan-tab ${this.state.activeTab === 'devices' ? 'active' : ''}" data-tab="devices">
            Devices (${devices.length})
          </button>
          <button class="shodan-tab ${this.state.activeTab === 'cameras' ? 'active' : ''}" data-tab="cameras">
            Cameras (${cameras.length})
          </button>
          <button class="shodan-tab ${this.state.activeTab === 'vulns' ? 'active' : ''}" data-tab="vulns">
            Vulns
          </button>
        </div>
        
        <div class="shodan-content">
          ${this.renderTabContent(stats, devices, cameras)}
        </div>
        
        ${this.state.lastUpdate ? `
          <div class="shodan-footer">
            Last updated: ${this.state.lastUpdate.toLocaleTimeString()}
            <button class="shodan-refresh-btn" id="shodanRefreshBtn">↻ Refresh</button>
          </div>
        ` : ''}
      </div>
    `;
    
    this.attachEventListeners();
  }

  private renderSetupMessage(): void {
    this.container.innerHTML = `
      <div class="shodan-panel">
        <div class="shodan-header">
          <div class="shodan-title">
            <span class="shodan-icon">📡</span>
            <span>Shodan Intelligence</span>
          </div>
        </div>
        
        <div class="shodan-setup">
          ${this.state.error ? `
            <div class="shodan-error">
              <span class="error-icon">⚠️</span>
              <span>${escapeHtml(this.state.error)}</span>
            </div>
          ` : ''}
          
          <p class="shodan-setup-text">
            ${this.state.apiKeyConfigured 
              ? 'Shodan API key is configured but validation failed. Check your key in Settings.'
              : 'Configure your Shodan API key in Settings to enable local device intelligence.'}
          </p>
          
          <p class="shodan-setup-hint">
            Add <code>SHODAN_API_KEY</code> in Settings → Security & Threats
            <br/>
            Get your API key from <a href="https://account.shodan.io" target="_blank" rel="noopener">account.shodan.io</a>
          </p>
        </div>
      </div>
    `;
  }

  private renderTabContent(
    stats: ShodanStats | null,
    devices: ShodanDevice[],
    cameras: ShodanDevice[]
  ): string {
    switch (this.state.activeTab) {
      case 'overview':
        return this.renderOverview(stats);
      case 'devices':
        return this.renderDevices(devices);
      case 'cameras':
        return this.renderCameras(cameras);
      case 'vulns':
        return this.renderVulns(stats);
      default:
        return '';
    }
  }

  private renderOverview(stats: ShodanStats | null): string {
    if (!stats) {
      return '<div class="shodan-empty">No data available</div>';
    }
    
    return `
      <div class="shodan-overview">
        <div class="shodan-stat-card shodan-stat-total">
          <div class="stat-value">${stats.total.toLocaleString()}</div>
          <div class="stat-label">Total Devices</div>
        </div>
        
        <div class="shodan-stat-section">
          <h4>Top Ports</h4>
          <div class="shodan-stat-list">
            ${stats.ports.slice(0, 5).map(p => `
              <div class="shodan-stat-item">
                <span class="stat-name">${formatPort(p.value)}</span>
                <span class="stat-count">${p.count.toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="shodan-stat-section">
          <h4>Top Organizations</h4>
          <div class="shodan-stat-list">
            ${stats.orgs.slice(0, 5).map(o => `
              <div class="shodan-stat-item">
                <span class="stat-name">${escapeHtml(o.value)}</span>
                <span class="stat-count">${o.count.toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="shodan-stat-section">
          <h4>Top Products</h4>
          <div class="shodan-stat-list">
            ${stats.products.slice(0, 5).map(p => `
              <div class="shodan-stat-item">
                <span class="stat-name">${escapeHtml(p.value)}</span>
                <span class="stat-count">${p.count.toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="shodan-stat-section">
          <h4>Operating Systems</h4>
          <div class="shodan-stat-list">
            ${stats.os.slice(0, 5).map(o => `
              <div class="shodan-stat-item">
                <span class="stat-name">${escapeHtml(o.value)}</span>
                <span class="stat-count">${o.count.toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  private renderDevices(devices: ShodanDevice[]): string {
    if (devices.length === 0) {
      return '<div class="shodan-empty">No devices found</div>';
    }
    
    return `
      <div class="shodan-devices">
        ${devices.map(d => `
          <div class="shodan-device-card">
            <div class="device-header">
              <span class="device-icon">${getDeviceIcon(d)}</span>
              <span class="device-ip">${escapeHtml(d.ip)}</span>
              <span class="device-port">:${d.port}</span>
            </div>
            <div class="device-details">
              ${d.org ? `<div class="device-org">${escapeHtml(d.org)}</div>` : ''}
              ${d.product ? `<div class="device-product">${escapeHtml(d.product)}${d.version ? ` ${escapeHtml(d.version)}` : ''}</div>` : ''}
              ${d.os ? `<div class="device-os">${escapeHtml(d.os)}</div>` : ''}
              ${d.city ? `<div class="device-location">📍 ${escapeHtml(d.city)}</div>` : ''}
            </div>
            ${d.vulns && d.vulns.length > 0 ? `
              <div class="device-vulns">
                <span class="vuln-badge">⚠️ ${d.vulns.length} CVEs</span>
              </div>
            ` : ''}
            <a href="http://${d.ip}:${d.port}" target="_blank" rel="noopener" class="device-link">
              Open →
            </a>
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderCameras(cameras: ShodanDevice[]): string {
    if (cameras.length === 0) {
      return '<div class="shodan-empty">No cameras found in this area</div>';
    }
    
    return `
      <div class="shodan-cameras">
        <p class="shodan-cameras-note">
          ⚠️ These cameras may require authentication. Click to attempt connection.
        </p>
        ${cameras.map(c => `
          <div class="shodan-camera-card">
            <div class="camera-header">
              <span class="camera-icon">📹</span>
              <span class="camera-ip">${escapeHtml(c.ip)}:${c.port}</span>
            </div>
            <div class="camera-details">
              ${c.product ? `<div class="camera-product">${escapeHtml(c.product)}</div>` : ''}
              ${c.org ? `<div class="camera-org">${escapeHtml(c.org)}</div>` : ''}
              ${c.city ? `<div class="camera-location">📍 ${escapeHtml(c.city)}</div>` : ''}
            </div>
            <div class="camera-actions">
              <a href="http://${c.ip}:${c.port}" target="_blank" rel="noopener" class="camera-link">
                HTTP
              </a>
              ${c.port === 554 ? `
                <a href="rtsp://${c.ip}:${c.port}" target="_blank" rel="noopener" class="camera-link">
                  RTSP
                </a>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderVulns(stats: ShodanStats | null): string {
    if (!stats || stats.vulns.length === 0) {
      return '<div class="shodan-empty">No vulnerability data available</div>';
    }
    
    return `
      <div class="shodan-vulns">
        <p class="shodan-vulns-summary">
          Found devices with <strong>${stats.vulns.length}</strong> different CVEs in this area.
        </p>
        <div class="shodan-vuln-list">
          ${stats.vulns.slice(0, 15).map(v => `
            <div class="shodan-vuln-item">
              <a href="https://nvd.nist.gov/vuln/detail/${v.value}" target="_blank" rel="noopener" class="vuln-id">
                ${escapeHtml(v.value)}
              </a>
              <span class="vuln-count">${v.count.toLocaleString()} devices</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Tab switching
    this.container.querySelectorAll('.shodan-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab') as ShodanPanelState['activeTab'];
        if (tabName) this.setActiveTab(tabName);
      });
    });
    
    // Refresh button
    const refreshBtn = this.container.querySelector('#shodanRefreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refresh());
    }
  }
}
