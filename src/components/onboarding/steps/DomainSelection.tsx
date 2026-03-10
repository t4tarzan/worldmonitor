import { useState, useEffect } from 'preact/hooks';

interface DomainSelectionProps {
  sessionToken: string;
  authToken?: string;
  stepData: any;
  onComplete: (data: any) => void;
  onBack?: () => void;
}

export default function DomainSelection({ sessionToken, authToken, onComplete, onBack }: DomainSelectionProps) {
  const [domainType, setDomainType] = useState<'subdomain' | 'custom'>('subdomain');
  const [subdomain, setSubdomain] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateSubdomain = (value: string): string | null => {
    if (value.length < 3) return 'Must be at least 3 characters';
    if (value.length > 30) return 'Must be 30 characters or less';
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(value)) {
      return 'Only lowercase letters, numbers, and hyphens (cannot start/end with hyphen)';
    }
    return null;
  };

  const checkSubdomainAvailability = async (value: string) => {
    const validationError = validateSubdomain(value);
    if (validationError) {
      setError(validationError);
      setAvailable(null);
      return;
    }

    setChecking(true);
    setError('');

    try {
      const response = await fetch(`/api/onboarding/subdomain/check/${encodeURIComponent(value)}`);
      const data = await response.json();
      
      setAvailable(data.available);
      if (!data.available && data.suggestion) {
        setSuggestion(data.suggestion);
      }
    } catch (err) {
      setError('Failed to check availability');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (subdomain && domainType === 'subdomain') {
      const timeoutId = setTimeout(() => checkSubdomainAvailability(subdomain), 300);
      return () => clearTimeout(timeoutId);
    }
  }, [subdomain, domainType]);

  const handleSubdomainChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomain(value);
    setAvailable(null);
    setSuggestion('');
    setError('');
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (domainType === 'subdomain') {
      if (!subdomain) {
        setError('Please enter a subdomain');
        return;
      }
      if (available !== true) {
        setError('Please choose an available subdomain');
        return;
      }
    } else {
      if (!customDomain) {
        setError('Please enter your custom domain');
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch('/api/onboarding/instance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          sessionToken,
          domainType,
          subdomain: domainType === 'subdomain' ? subdomain : null,
          customDomain: domainType === 'custom' ? customDomain : null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create instance');
        setLoading(false);
        return;
      }

      onComplete({
        domainType,
        subdomain,
        customDomain,
        instanceId: data.instance.id,
        url: data.instance.deployment_url || `https://${subdomain}.worldmonitor.app`
      });
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="step-content">
      <h3 className="step-title-main">Choose Your Domain</h3>
      <p className="step-description">
        Select how you want to access your personalized WorldMonitor.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Free Subdomain Option */}
          <div
            onClick={() => setDomainType('subdomain')}
            style={{
              padding: '24px',
              background: domainType === 'subdomain' ? 'rgba(16, 185, 129, 0.1)' : '#1a1f1a',
              border: `2px solid ${domainType === 'subdomain' ? '#10b981' : '#2f3f2f'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: `2px solid ${domainType === 'subdomain' ? '#10b981' : '#6f7f6f'}`,
                background: domainType === 'subdomain' ? '#10b981' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {domainType === 'subdomain' && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff' }} />
                )}
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff' }}>
                  🆓 Free Subdomain
                </div>
                <div style={{ fontSize: '13px', color: '#a0a0a0', marginTop: '4px' }}>
                  Recommended for getting started
                </div>
              </div>
            </div>

            {domainType === 'subdomain' && (
              <div style={{ marginTop: '16px' }}>
                <label className="form-label">Your Monitor URL</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <input
                    type="text"
                    className={`form-input ${error && !customDomain ? 'error' : ''}`}
                    placeholder="yourname"
                    value={subdomain}
                    onInput={handleSubdomainChange}
                    style={{ flex: 1 }}
                    disabled={loading}
                  />
                  <span style={{ fontSize: '15px', color: '#a0a0a0', whiteSpace: 'nowrap' }}>
                    .worldmonitor.app
                  </span>
                </div>
                
                {checking && (
                  <div className="form-success" style={{ marginTop: '8px' }}>
                    <div className="loading-spinner" /> Checking availability...
                  </div>
                )}
                
                {available === true && (
                  <div className="form-success" style={{ marginTop: '8px' }}>
                    ✓ Available! Your URL will be: https://{subdomain}.worldmonitor.app
                  </div>
                )}
                
                {available === false && (
                  <div style={{ marginTop: '8px' }}>
                    <div className="form-error">✗ This subdomain is already taken</div>
                    {suggestion && (
                      <div style={{ marginTop: '8px', fontSize: '13px', color: '#a0a0a0' }}>
                        Try: <button
                          type="button"
                          onClick={() => setSubdomain(suggestion)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#10b981',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            padding: 0,
                            font: 'inherit'
                          }}
                        >
                          {suggestion}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {error && domainType === 'subdomain' && !available && (
                  <div className="form-error" style={{ marginTop: '8px' }}>✗ {error}</div>
                )}

                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✓</span> Instant setup
                  </div>
                  <div style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✓</span> SSL certificate included
                  </div>
                  <div style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✓</span> No configuration needed
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Custom Domain Option */}
          <div
            onClick={() => setDomainType('custom')}
            style={{
              padding: '24px',
              background: domainType === 'custom' ? 'rgba(16, 185, 129, 0.1)' : '#1a1f1a',
              border: `2px solid ${domainType === 'custom' ? '#10b981' : '#2f3f2f'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: `2px solid ${domainType === 'custom' ? '#10b981' : '#6f7f6f'}`,
                background: domainType === 'custom' ? '#10b981' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {domainType === 'custom' && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff' }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff' }}>
                    ⭐ Custom Domain
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    background: '#10b981',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '600',
                    borderRadius: '4px'
                  }}>
                    PRO PLAN
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#a0a0a0', marginTop: '4px' }}>
                  Use your own domain name
                </div>
              </div>
            </div>

            {domainType === 'custom' && (
              <div style={{ marginTop: '16px' }}>
                <label className="form-label">Your Domain</label>
                <input
                  type="text"
                  className={`form-input ${error && customDomain ? 'error' : ''}`}
                  placeholder="monitor.yourcompany.com"
                  value={customDomain}
                  onInput={(e) => setCustomDomain((e.target as HTMLInputElement).value)}
                  style={{ marginTop: '8px' }}
                  disabled={loading}
                />
                
                {error && domainType === 'custom' && (
                  <div className="form-error" style={{ marginTop: '8px' }}>✗ {error}</div>
                )}

                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✓</span> Professional branding
                  </div>
                  <div style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✓</span> White-label option
                  </div>
                  <div style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✓</span> Custom SSL certificate
                  </div>
                  <div style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✓</span> Priority support
                  </div>
                </div>

                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#f59e0b'
                }}>
                  ⚠️ Requires Pro Plan ($9.97/month) - You'll configure billing in the next step
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="button-group">
          {onBack && (
            <button type="button" className="btn btn-secondary" onClick={onBack} disabled={loading}>
              Back
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || (domainType === 'subdomain' && available !== true) || (domainType === 'custom' && !customDomain)}
          >
            {loading && <div className="loading-spinner" />}
            {loading ? 'Setting up...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}
