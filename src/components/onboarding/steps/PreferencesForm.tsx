import { useState } from 'preact/hooks';

interface PreferencesFormProps {
  sessionToken: string;
  authToken?: string;
  stepData: any;
  onComplete: (data: any) => void;
  onBack?: () => void;
}

const FOCUS_AREAS = [
  { id: 'geopolitics', label: 'Geopolitics & Conflicts', icon: '🌍' },
  { id: 'finance', label: 'Financial Markets', icon: '💹' },
  { id: 'technology', label: 'Technology & Startups', icon: '💻' },
  { id: 'climate', label: 'Climate & Environment', icon: '🌱' },
  { id: 'infrastructure', label: 'Infrastructure & Energy', icon: '⚡' },
  { id: 'cybersecurity', label: 'Cybersecurity', icon: '🔒' }
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' }
];

export default function PreferencesForm({ sessionToken, authToken, onComplete, onBack }: PreferencesFormProps) {
  const [formData, setFormData] = useState({
    focusAreas: [] as string[],
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    theme: 'dark' as 'dark' | 'light' | 'auto',
    mapView: 'globe' as 'globe' | 'flat',
    notifications: {
      email: true,
      frequency: 'immediate' as 'immediate' | 'hourly' | 'daily',
      breakingNews: true
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleFocusArea = (id: string) => {
    setFormData({
      ...formData,
      focusAreas: formData.focusAreas.includes(id)
        ? formData.focusAreas.filter(a => a !== id)
        : [...formData.focusAreas, id]
    });
  };

  const getSuggestedMonitors = () => {
    const monitors = [];
    if (formData.focusAreas.includes('geopolitics')) {
      monitors.push({ name: 'Middle East Conflicts', type: 'region', enabled: true });
    }
    if (formData.focusAreas.includes('finance')) {
      monitors.push({ name: 'Bitcoin Price Alerts', type: 'keyword', enabled: true });
    }
    if (formData.focusAreas.includes('technology')) {
      monitors.push({ name: 'AI Startup News', type: 'keyword', enabled: true });
    }
    return monitors.slice(0, 3);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (formData.focusAreas.length === 0) {
      setError('Please select at least one focus area');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/onboarding/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          sessionToken,
          ...formData,
          initialMonitors: getSuggestedMonitors()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save preferences');
        setLoading(false);
        return;
      }

      onComplete(formData);
    } catch (error) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="step-content">
      <h3 className="step-title-main">Customize Your Experience</h3>
      <p className="step-description">
        Tell us what matters to you, and we'll personalize your WorldMonitor.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Primary Focus Areas *</label>
          <p style={{ fontSize: '13px', color: '#a0a0a0', marginBottom: '12px' }}>
            Select the topics you want to monitor
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {FOCUS_AREAS.map(area => (
              <div
                key={area.id}
                onClick={() => toggleFocusArea(area.id)}
                style={{
                  padding: '16px',
                  background: formData.focusAreas.includes(area.id) ? 'rgba(16, 185, 129, 0.1)' : '#1a1f1a',
                  border: `2px solid ${formData.focusAreas.includes(area.id) ? '#10b981' : '#2f3f2f'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <span style={{ fontSize: '24px' }}>{area.icon}</span>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: formData.focusAreas.includes(area.id) ? '#10b981' : '#ffffff'
                }}>
                  {area.label}
                </span>
              </div>
            ))}
          </div>
          {error && formData.focusAreas.length === 0 && (
            <div className="form-error" style={{ marginTop: '8px' }}>✗ {error}</div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="language">Language</label>
            <select
              id="language"
              className="form-input"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: (e.target as HTMLSelectElement).value })}
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="theme">Theme</label>
            <select
              id="theme"
              className="form-input"
              value={formData.theme}
              onChange={(e) => setFormData({ ...formData, theme: (e.target as HTMLSelectElement).value as any })}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '24px' }}>
          <label className="form-label">Default Map View</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div
              onClick={() => setFormData({ ...formData, mapView: 'globe' })}
              style={{
                flex: 1,
                padding: '16px',
                background: formData.mapView === 'globe' ? 'rgba(16, 185, 129, 0.1)' : '#1a1f1a',
                border: `2px solid ${formData.mapView === 'globe' ? '#10b981' : '#2f3f2f'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌐</div>
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: formData.mapView === 'globe' ? '#10b981' : '#ffffff'
              }}>
                3D Globe
              </div>
            </div>
            <div
              onClick={() => setFormData({ ...formData, mapView: 'flat' })}
              style={{
                flex: 1,
                padding: '16px',
                background: formData.mapView === 'flat' ? 'rgba(16, 185, 129, 0.1)' : '#1a1f1a',
                border: `2px solid ${formData.mapView === 'flat' ? '#10b981' : '#2f3f2f'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗺️</div>
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: formData.mapView === 'flat' ? '#10b981' : '#ffffff'
              }}>
                Flat Map
              </div>
            </div>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '24px' }}>
          <label className="form-label">Notifications</label>
          <div style={{ padding: '16px', background: '#1a1f1a', borderRadius: '8px', border: '1px solid #2f3f2f' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.notifications.email}
                onChange={(e) => setFormData({
                  ...formData,
                  notifications: { ...formData.notifications, email: (e.target as HTMLInputElement).checked }
                })}
              />
              <span style={{ fontSize: '14px', color: '#ffffff' }}>Email alerts</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.notifications.breakingNews}
                onChange={(e) => setFormData({
                  ...formData,
                  notifications: { ...formData.notifications, breakingNews: (e.target as HTMLInputElement).checked }
                })}
              />
              <span style={{ fontSize: '14px', color: '#ffffff' }}>Breaking news notifications</span>
            </label>
            {formData.notifications.email && (
              <div style={{ marginTop: '12px' }}>
                <label className="form-label" style={{ fontSize: '13px' }}>Alert Frequency</label>
                <select
                  className="form-input"
                  value={formData.notifications.frequency}
                  onChange={(e) => setFormData({
                    ...formData,
                    notifications: { ...formData.notifications, frequency: (e.target as HTMLSelectElement).value as any }
                  })}
                  style={{ marginTop: '6px' }}
                >
                  <option value="immediate">Immediate</option>
                  <option value="hourly">Hourly digest</option>
                  <option value="daily">Daily digest</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {getSuggestedMonitors().length > 0 && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#10b981', marginBottom: '12px' }}>
              ✨ Suggested Monitors
            </div>
            <div style={{ fontSize: '13px', color: '#a0a0a0', marginBottom: '12px' }}>
              Based on your focus areas, we'll create these monitors for you:
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#ffffff' }}>
              {getSuggestedMonitors().map((monitor, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{monitor.name}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            color: '#ef4444',
            fontSize: '14px',
            marginTop: '16px'
          }}>
            {error}
          </div>
        )}

        <div className="button-group">
          {onBack && (
            <button type="button" className="btn btn-secondary" onClick={onBack} disabled={loading}>
              Back
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || formData.focusAreas.length === 0}
          >
            {loading && <div className="loading-spinner" />}
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}
