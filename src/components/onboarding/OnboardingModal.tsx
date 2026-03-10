import { useState, useEffect } from 'preact/hooks';
import AccountCreation from './steps/AccountCreation';
import PreferencesForm from './steps/PreferencesForm';
import DomainSelection from './steps/DomainSelection';
import PlanSelection from './steps/PlanSelection';
import Confirmation from './steps/Confirmation';
import './OnboardingModal.css';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OnboardingState {
  currentStep: number;
  sessionToken: string;
  stepData: {
    step1?: any;
    step2?: any;
    step3?: any;
    step4?: any;
    step5?: any;
  };
  userId?: string;
  authToken?: string;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 1,
    sessionToken: '',
    stepData: {}
  });

  useEffect(() => {
    if (isOpen) {
      initializeSession();
    }
  }, [isOpen]);

  const initializeSession = async () => {
    const existingSession = localStorage.getItem('onboarding_session');
    
    if (existingSession) {
      const parsed = JSON.parse(existingSession);
      const shouldResume = confirm('You have an incomplete onboarding. Continue where you left off?');
      
      if (shouldResume) {
        setState(parsed);
        return;
      }
    }

    const response = await fetch('/api/onboarding/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();
    
    setState({
      currentStep: 1,
      sessionToken: data.session.session_token,
      stepData: {}
    });
  };

  const saveProgress = (newState: Partial<OnboardingState>) => {
    const updated = { ...state, ...newState };
    setState(updated);
    localStorage.setItem('onboarding_session', JSON.stringify(updated));
  };

  const handleStepComplete = (stepNumber: number, data: any) => {
    const newStepData = {
      ...state.stepData,
      [`step${stepNumber}`]: data
    };

    if (stepNumber === 1) {
      saveProgress({
        stepData: newStepData,
        userId: data.userId,
        authToken: data.token,
        currentStep: 2
      });
    } else if (stepNumber === 3 && data.domainType === 'subdomain') {
      saveProgress({
        stepData: newStepData,
        currentStep: 5
      });
    } else {
      saveProgress({
        stepData: newStepData,
        currentStep: stepNumber + 1
      });
    }
  };

  const handleBack = () => {
    if (state.currentStep > 1) {
      saveProgress({ currentStep: state.currentStep - 1 });
    }
  };

  const handleClose = () => {
    if (state.currentStep < 5) {
      const shouldClose = confirm('Your progress will be saved. Close onboarding?');
      if (!shouldClose) return;
    }
    
    if (state.currentStep === 5) {
      localStorage.removeItem('onboarding_session');
    }
    
    onClose();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && state.currentStep !== 4) {
      handleClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, state.currentStep]);

  if (!isOpen) return null;

  const steps = [
    { number: 1, title: 'Create Account', component: AccountCreation },
    { number: 2, title: 'Preferences', component: PreferencesForm },
    { number: 3, title: 'Domain', component: DomainSelection },
    { number: 4, title: 'Plan & Billing', component: PlanSelection },
    { number: 5, title: 'Confirmation', component: Confirmation }
  ];

  const CurrentStepComponent = steps[state.currentStep - 1]?.component;
  const shouldShowStep4 = state.stepData.step3?.domainType === 'custom';

  return (
    <div className="onboarding-modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) handleClose();
    }}>
      <div className="onboarding-modal" data-testid="onboarding-modal">
        <button className="modal-close" onClick={handleClose} aria-label="Close">
          ×
        </button>

        <div className="modal-header">
          <h2>Get Your WorldMonitor</h2>
          <div className="progress-indicator">
            {steps.map((step) => {
              if (step.number === 4 && !shouldShowStep4) return null;
              
              return (
                <div
                  key={step.number}
                  className={`progress-step ${state.currentStep === step.number ? 'active' : ''} ${state.currentStep > step.number ? 'completed' : ''}`}
                >
                  <div className="step-number">{step.number}</div>
                  <div className="step-title">{step.title}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-content">
          {CurrentStepComponent && (
            <CurrentStepComponent
              sessionToken={state.sessionToken}
              authToken={state.authToken}
              stepData={state.stepData}
              onComplete={(data: any) => handleStepComplete(state.currentStep, data)}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}
