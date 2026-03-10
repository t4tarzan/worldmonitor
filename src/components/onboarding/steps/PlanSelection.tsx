import { useState } from 'preact/hooks';

interface PlanSelectionProps {
  sessionToken: string;
  authToken?: string;
  stepData: any;
  onComplete: (data: any) => void;
  onBack?: () => void;
}

const PRICING_TIERS = {
  pro: {
    name: 'Professional',
    monthly: 9.97,
    annual: 99,
    features: [
      'Custom domain support',
      '15 custom monitors',
      'Unlimited saved views',
      'Email + Webhook alerts',
      'Priority support',
      'Advanced analytics'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    monthly: 29.97,
    annual: 299,
    features: [
      'Everything in Pro',
      'Unlimited monitors',
      'API access (10k requests/month)',
      'White-label option',
      'SMS alerts',
      'Slack/Discord integration',
      'Dedicated support',
      'SLA guarantee (99.9% uptime)'
    ]
  }
};

export default function PlanSelection({ onComplete, onBack }: PlanSelectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'enterprise'>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');

    try {
      // For localhost demo, we'll skip actual Stripe integration
      // In production, this would create a Stripe checkout session
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      onComplete({
        planTier: selectedPlan,
        billingCycle,
        amount: billingCycle === 'monthly' 
          ? PRICING_TIERS[selectedPlan].monthly 
          : PRICING_TIERS[selectedPlan].annual
      });
    } catch (err) {
      setError('Payment processing failed. Please try again.');
      setLoading(false);
    }
  };

  const getPrice = (plan: 'pro' | 'enterprise') => {
    return billingCycle === 'monthly' 
      ? PRICING_TIERS[plan].monthly 
      : PRICING_TIERS[plan].annual;
  };

  const getSavings = (plan: 'pro' | 'enterprise') => {
    const monthlyTotal = PRICING_TIERS[plan].monthly * 12;
    const annualPrice = PRICING_TIERS[plan].annual;
    return monthlyTotal - annualPrice;
  };

  return (
    <div className="step-content">
      <h3 className="step-title-main">Choose Your Plan</h3>
      <p className="step-description">
        Custom domains require a Pro or Enterprise plan. Start with a 14-day free trial.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Billing Cycle Toggle */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '32px',
          padding: '4px',
          background: '#1a1f1a',
          borderRadius: '8px',
          width: 'fit-content',
          margin: '0 auto 32px'
        }}>
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '8px 24px',
              background: billingCycle === 'monthly' ? '#10b981' : 'transparent',
              color: billingCycle === 'monthly' ? '#ffffff' : '#a0a0a0',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            style={{
              padding: '8px 24px',
              background: billingCycle === 'annual' ? '#10b981' : 'transparent',
              color: billingCycle === 'annual' ? '#ffffff' : '#a0a0a0',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            Annual
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: '#10b981',
              color: '#ffffff',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: '600'
            }}>
              SAVE 20%
            </span>
          </button>
        </div>

        {/* Plan Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          {/* Pro Plan */}
          <div
            onClick={() => setSelectedPlan('pro')}
            style={{
              padding: '24px',
              background: selectedPlan === 'pro' ? 'rgba(16, 185, 129, 0.1)' : '#1a1f1a',
              border: `2px solid ${selectedPlan === 'pro' ? '#10b981' : '#2f3f2f'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: `2px solid ${selectedPlan === 'pro' ? '#10b981' : '#6f7f6f'}`,
              background: selectedPlan === 'pro' ? '#10b981' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {selectedPlan === 'pro' && (
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff' }} />
              )}
            </div>

            <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
              Professional
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981', marginBottom: '4px' }}>
              ${getPrice('pro')}
              <span style={{ fontSize: '16px', fontWeight: '400', color: '#a0a0a0' }}>
                /{billingCycle === 'monthly' ? 'mo' : 'yr'}
              </span>
            </div>
            {billingCycle === 'annual' && (
              <div style={{ fontSize: '13px', color: '#10b981', marginBottom: '16px' }}>
                Save ${getSavings('pro')}/year
              </div>
            )}
            <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0 0' }}>
              {PRICING_TIERS.pro.features.map((feature, idx) => (
                <li key={idx} style={{ 
                  fontSize: '13px', 
                  color: '#a0a0a0', 
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{ color: '#10b981' }}>✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Enterprise Plan */}
          <div
            onClick={() => setSelectedPlan('enterprise')}
            style={{
              padding: '24px',
              background: selectedPlan === 'enterprise' ? 'rgba(16, 185, 129, 0.1)' : '#1a1f1a',
              border: `2px solid ${selectedPlan === 'enterprise' ? '#10b981' : '#2f3f2f'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: `2px solid ${selectedPlan === 'enterprise' ? '#10b981' : '#6f7f6f'}`,
              background: selectedPlan === 'enterprise' ? '#10b981' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {selectedPlan === 'enterprise' && (
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff' }} />
              )}
            </div>

            <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
              Enterprise
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981', marginBottom: '4px' }}>
              ${getPrice('enterprise')}
              <span style={{ fontSize: '16px', fontWeight: '400', color: '#a0a0a0' }}>
                /{billingCycle === 'monthly' ? 'mo' : 'yr'}
              </span>
            </div>
            {billingCycle === 'annual' && (
              <div style={{ fontSize: '13px', color: '#10b981', marginBottom: '16px' }}>
                Save ${getSavings('enterprise')}/year
              </div>
            )}
            <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0 0' }}>
              {PRICING_TIERS.enterprise.features.map((feature, idx) => (
                <li key={idx} style={{ 
                  fontSize: '13px', 
                  color: '#a0a0a0', 
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{ color: '#10b981' }}>✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Trial Notice */}
        <div style={{
          padding: '16px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#10b981', fontWeight: '500', marginBottom: '4px' }}>
            🎉 14-Day Free Trial
          </div>
          <div style={{ fontSize: '13px', color: '#a0a0a0' }}>
            No charge until {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}. Cancel anytime.
          </div>
        </div>

        {/* Demo Notice for Localhost */}
        <div style={{
          padding: '16px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: '500', marginBottom: '4px' }}>
            💡 Demo Mode
          </div>
          <div style={{ fontSize: '13px', color: '#a0a0a0' }}>
            This is a demo. No actual payment will be processed. In production, Stripe checkout would appear here.
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            color: '#ef4444',
            fontSize: '14px',
            marginBottom: '16px'
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
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading && <div className="loading-spinner" />}
            {loading ? 'Processing...' : `Start 14-Day Trial - $${getPrice(selectedPlan)}/${billingCycle === 'monthly' ? 'mo' : 'yr'}`}
          </button>
        </div>
      </form>
    </div>
  );
}
