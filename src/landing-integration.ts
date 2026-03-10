// Simple integration script to add onboarding modal to landing page
// This will be loaded via a script tag in landing.html

import { h, render } from 'preact';
import OnboardingModal from './components/onboarding/OnboardingModal';

let modalContainer: HTMLDivElement | null = null;
let isModalOpen = false;

function openOnboardingModal() {
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'onboarding-modal-root';
    document.body.appendChild(modalContainer);
  }

  isModalOpen = true;
  renderModal();
}

function closeOnboardingModal() {
  isModalOpen = false;
  renderModal();
}

function renderModal() {
  if (modalContainer) {
    render(
      h(OnboardingModal, { 
        isOpen: isModalOpen, 
        onClose: closeOnboardingModal 
      }),
      modalContainer
    );
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  // Find all "Get My Monitor" buttons and attach click handlers
  const buttons = document.querySelectorAll('.cta-button, [href="#get-started"]');
  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      openOnboardingModal();
    });
  });

  // Also expose globally for manual triggering
  (window as any).openOnboarding = openOnboardingModal;
}
