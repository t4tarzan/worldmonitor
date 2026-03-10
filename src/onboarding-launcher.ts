import { h, render } from 'preact';
import OnboardingModal from './components/onboarding/OnboardingModal';

// Initialize onboarding modal when DOM is ready
export function initOnboarding() {
  let modalContainer: HTMLDivElement | null = null;
  let isOpen = false;

  const openModal = () => {
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'onboarding-modal-root';
      document.body.appendChild(modalContainer);
    }

    isOpen = true;
    renderModal();
  };

  const closeModal = () => {
    isOpen = false;
    renderModal();
  };

  const renderModal = () => {
    if (modalContainer) {
      render(
        h(OnboardingModal, { isOpen, onClose: closeModal }),
        modalContainer
      );
    }
  };

  // Attach to window for easy access
  (window as any).openOnboarding = openModal;

  // Attach click handlers to "Get My Monitor" buttons
  document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('[data-onboarding-trigger]');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    });
  });

  return { openModal, closeModal };
}

// Auto-initialize
if (typeof window !== 'undefined') {
  initOnboarding();
}
