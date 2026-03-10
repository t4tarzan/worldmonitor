import { useState } from 'preact/hooks';

interface AccountCreationProps {
  sessionToken: string;
  onComplete: (data: any) => void;
  onBack?: () => void;
}

export default function AccountCreation({ sessionToken, onComplete }: AccountCreationProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const calculatePasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  };

  const checkEmailAvailability = async (email: string) => {
    if (!validateEmail(email)) return;

    setEmailChecking(true);
    try {
      const response = await fetch(`/api/onboarding/check-email/${encodeURIComponent(email)}`);
      const data = await response.json();
      setEmailAvailable(data.available);
    } catch (error) {
      console.error('Email check failed:', error);
    } finally {
      setEmailChecking(false);
    }
  };

  const handleEmailChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const email = target.value;
    setFormData({ ...formData, email });
    setErrors({ ...errors, email: '' });
    setEmailAvailable(null);

    if (validateEmail(email)) {
      const timeoutId = setTimeout(() => checkEmailAvailability(email), 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const handlePasswordChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const password = target.value;
    setFormData({ ...formData, password });
    setErrors({ ...errors, password: '' });

    if (password.length > 0) {
      setPasswordStrength(calculatePasswordStrength(password));
    } else {
      setPasswordStrength(null);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    } else if (emailAvailable === false) {
      newErrors.email = 'Email already registered';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!termsAccepted) {
      newErrors.terms = 'You must accept the terms and privacy policy';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/onboarding/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName || null,
          authMethod: 'email'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ submit: data.error || 'Registration failed' });
        setLoading(false);
        return;
      }

      onComplete({
        userId: data.user.id,
        email: data.user.email,
        token: data.token
      });
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (!passwordStrength) return '#2f3f2f';
    if (passwordStrength === 'weak') return '#ef4444';
    if (passwordStrength === 'medium') return '#f59e0b';
    return '#10b981';
  };

  const getPasswordStrengthWidth = () => {
    if (!passwordStrength) return '0%';
    if (passwordStrength === 'weak') return '33%';
    if (passwordStrength === 'medium') return '66%';
    return '100%';
  };

  return (
    <div className="step-content">
      <h3 className="step-title-main">Create Your Account</h3>
      <p className="step-description">
        Get started with your personalized WorldMonitor in just a few steps.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email Address *
          </label>
          <input
            id="email"
            type="email"
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="you@example.com"
            value={formData.email}
            onInput={handleEmailChange}
            disabled={loading}
          />
          {emailChecking && (
            <div className="form-success">
              <div className="loading-spinner" /> Checking availability...
            </div>
          )}
          {emailAvailable === true && (
            <div className="form-success">✓ Email available</div>
          )}
          {emailAvailable === false && (
            <div className="form-error">✗ Email already registered</div>
          )}
          {errors.email && <div className="form-error">✗ {errors.email}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">
            Password *
          </label>
          <input
            id="password"
            type="password"
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="At least 8 characters"
            value={formData.password}
            onInput={handlePasswordChange}
            disabled={loading}
          />
          {passwordStrength && (
            <div style={{ marginTop: '8px' }}>
              <div style={{
                height: '4px',
                background: '#1f2f1f',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: getPasswordStrengthWidth(),
                  background: getPasswordStrengthColor(),
                  transition: 'all 0.3s'
                }} />
              </div>
              <div style={{
                fontSize: '13px',
                color: getPasswordStrengthColor(),
                marginTop: '4px',
                textTransform: 'capitalize'
              }}>
                {passwordStrength} password
              </div>
            </div>
          )}
          {errors.password && <div className="form-error">✗ {errors.password}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="fullName">
            Full Name (Optional)
          </label>
          <input
            id="fullName"
            type="text"
            className="form-input"
            placeholder="John Doe"
            value={formData.fullName}
            onInput={(e) => setFormData({ ...formData, fullName: (e.target as HTMLInputElement).value })}
            disabled={loading}
          />
        </div>

        <div style={{ marginTop: '24px', marginBottom: '24px' }}>
          <div style={{
            padding: '16px',
            background: '#1a1f1a',
            border: '1px solid #2f3f2f',
            borderRadius: '8px'
          }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted((e.target as HTMLInputElement).checked);
                  setErrors({ ...errors, terms: '' });
                }}
                disabled={loading}
                style={{ marginTop: '2px' }}
              />
              <span style={{ fontSize: '14px', color: '#a0a0a0', lineHeight: '1.5' }}>
                I agree to the{' '}
                <a href="/terms" target="_blank" style={{ color: '#10b981', textDecoration: 'none' }}>
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" target="_blank" style={{ color: '#10b981', textDecoration: 'none' }}>
                  Privacy Policy
                </a>
              </span>
            </label>
            {errors.terms && <div className="form-error" style={{ marginTop: '8px' }}>✗ {errors.terms}</div>}
          </div>
        </div>

        {errors.submit && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            color: '#ef4444',
            fontSize: '14px',
            marginBottom: '24px'
          }}>
            {errors.submit}
          </div>
        )}

        <div className="button-group">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || emailAvailable === false || !termsAccepted}
          >
            {loading && <div className="loading-spinner" />}
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      </form>

      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: '#1a1f1a',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#a0a0a0' }}>
          Or continue with
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1 }}
            disabled={loading}
            onClick={() => alert('Google OAuth coming soon!')}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.438 15.983 5.482 18 9.003 18z" fill="#34A853"/>
              <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.482 0 2.438 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1 }}
            disabled={loading}
            onClick={() => alert('GitHub OAuth coming soon!')}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            GitHub
          </button>
        </div>
      </div>
    </div>
  );
}
