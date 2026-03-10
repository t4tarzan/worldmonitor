import { useState, useEffect } from 'preact/hooks';
import confetti from 'canvas-confetti';

interface ConfirmationProps {
  sessionToken: string;
  authToken?: string;
  stepData: any;
  onComplete: (data: any) => void;
  onBack?: () => void;
}

export default function Confirmation({ stepData }: ConfirmationProps) {
  const [setupProgress, setSetupProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [complete, setComplete] = useState(false);

  const setupSteps = [
    { message: 'Creating your instance...', duration: 1000 },
    { message: 'Configuring domain...', duration: 800 },
    { message: 'Setting up monitors...', duration: 1200 },
    { message: 'Applying preferences...', duration: 600 },
    { message: 'Finalizing setup...', duration: 800 }
  ];

  useEffect(() => {
    let progress = 0;

    const runSetup = async () => {
      for (let i = 0; i < setupSteps.length; i++) {
        const step = setupSteps[i];
        if (step) {
          setCurrentStepIndex(i);
          const duration = step.duration;
          if (duration) {
            await new Promise(resolve => setTimeout(resolve, duration));
            progress += 20;
            setSetupProgress(progress);
          }
        }
      }

      setComplete(true);
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    };

    runSetup();
  }, []);

  const url = stepData.step3?.url || `https://${stepData.step3?.subdomain}.worldmonitor.app`;
  const isCustomDomain = stepData.step3?.domainType === 'custom';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const goToDashboard = () => {
    // For localhost demo, redirect to the main dashboard
    window.location.href = '/index.html';
  };

  useEffect(() => {
    if (complete) {
      // Auto-redirect after 10 seconds
      const timer = setTimeout(() => {
        goToDashboard();
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [complete]);

  if (!complete) {
    return (
      <div className="step-content">
        <h3 className="step-title-main">Setting Up Your Monitor</h3>
        <p className="step-description">
          Please wait while we prepare your personalized WorldMonitor...
        </p>

        <div style={{ marginTop: '40px' }}>
          {setupSteps.map((step, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '16px',
              opacity: idx <= currentStepIndex ? 1 : 0.3,
              transition: 'opacity 0.3s'
            }}>
              {idx < currentStepIndex ? (
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '14px'
                }}>
                  ✓
                </div>
              ) : idx === currentStepIndex ? (
                <div className="loading-spinner" style={{ width: '24px', height: '24px' }} />
              ) : (
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '2px solid #2f3f2f'
                }} />
              )}
              <span style={{ 
                fontSize: '15px', 
                color: '#6f7f6f',
                fontWeight: '400'
              }}>
                {step.message}
              </span>
            </div>
          ))}

          <div style={{
            marginTop: '32px',
            height: '8px',
            background: '#1f2f1f',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${setupProgress}%`,
              background: 'linear-gradient(90deg, #10b981, #059669)',
              transition: 'width 0.5s ease-out'
            }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="step-content">
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
        <h3 className="step-title-main" style={{ marginBottom: '8px' }}>You're All Set!</h3>
        <p className="step-description">
          Your WorldMonitor is ready and waiting for you.
        </p>
      </div>

      <div style={{
        padding: '24px',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <div style={{ fontSize: '14px', color: '#a0a0a0', marginBottom: '8px' }}>
          Your WorldMonitor is ready at:
        </div>
        <div style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#10b981', 
          marginBottom: '12px',
          wordBreak: 'break-all'
        }}>
          🔗 {url}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => copyToClipboard(url)}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Copy Link
          </button>
          <button
            onClick={goToDashboard}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            Visit Now
          </button>
        </div>
      </div>

      {isCustomDomain && (
        <div style={{
          padding: '20px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#f59e0b', marginBottom: '12px' }}>
            ⚠️ Custom Domain Setup Required
          </div>
          <p style={{ fontSize: '14px', color: '#a0a0a0', marginBottom: '16px' }}>
            To activate {stepData.step3?.customDomain}, add this DNS record:
          </p>
          <div style={{
            padding: '12px',
            background: '#1a1f1a',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#10b981',
            marginBottom: '12px'
          }}>
            Type: CNAME<br />
            Name: {stepData.step3?.customDomain?.split('.')[0]}<br />
            Value: cname.worldmonitor.app<br />
            TTL: 3600
          </div>
          <button
            onClick={() => copyToClipboard(`Type: CNAME\nName: ${stepData.step3?.customDomain?.split('.')[0]}\nValue: cname.worldmonitor.app\nTTL: 3600`)}
            className="btn btn-secondary"
          >
            Copy DNS Instructions
          </button>
          <p style={{ fontSize: '13px', color: '#a0a0a0', marginTop: '12px' }}>
            We'll verify and activate your domain within 24 hours. You'll receive an email when it's ready.
          </p>
        </div>
      )}

      <div style={{
        padding: '20px',
        background: '#1a1f1a',
        border: '1px solid #2f3f2f',
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '12px' }}>
          📧 Confirmation sent to:
        </div>
        <div style={{ fontSize: '14px', color: '#a0a0a0' }}>
          {stepData.step1?.email}
        </div>
      </div>

      {stepData.step2?.focusAreas && stepData.step2.focusAreas.length > 0 && (
        <div style={{
          padding: '20px',
          background: '#1a1f1a',
          border: '1px solid #2f3f2f',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '12px' }}>
            🎯 Your monitors are active:
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#a0a0a0' }}>
            {stepData.step2.focusAreas.includes('geopolitics') && (
              <li style={{ marginBottom: '6px' }}>Middle East Conflicts</li>
            )}
            {stepData.step2.focusAreas.includes('finance') && (
              <li style={{ marginBottom: '6px' }}>Bitcoin Price Alerts</li>
            )}
            {stepData.step2.focusAreas.includes('technology') && (
              <li style={{ marginBottom: '6px' }}>AI Startup News</li>
            )}
          </ul>
        </div>
      )}

      <div style={{
        padding: '20px',
        background: '#1a1f1a',
        border: '1px solid #2f3f2f',
        borderRadius: '12px',
        marginBottom: '32px'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '12px' }}>
          📚 Quick Start Guide:
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#a0a0a0' }}>
          <li style={{ marginBottom: '6px' }}>Customize your dashboard layout</li>
          <li style={{ marginBottom: '6px' }}>Add more monitors for your topics</li>
          <li style={{ marginBottom: '6px' }}>Set up alert preferences</li>
          {stepData.step4 && (
            <li style={{ marginBottom: '6px' }}>Invite team members (Pro feature)</li>
          )}
        </ul>
      </div>

      <div className="button-group">
        <button
          onClick={goToDashboard}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          Go to Dashboard →
        </button>
      </div>

      <p style={{ 
        textAlign: 'center', 
        fontSize: '13px', 
        color: '#6f7f6f', 
        marginTop: '16px' 
      }}>
        Redirecting automatically in 10 seconds...
      </p>
    </div>
  );
}
