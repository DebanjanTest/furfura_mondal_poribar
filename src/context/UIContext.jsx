import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const UIStateContext = createContext();

export function UIProvider({ children }) {
  const [activeModal, setActiveModal] = useState(null);
  const [lightboxData, setLightboxData] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [activeVibe, setActiveVibe] = useState('auto');
  const [shankhaActive, setShankhaActive] = useState(false);
  const [hasEnteredSite, setHasEnteredSite] = useState(() => {
    try {
      return sessionStorage.getItem('mondal_bari_welcome_session_entered') === 'true';
    } catch (_) {
      return false;
    }
  });

  // Calculate actual vibe from solar hour if set to 'auto'
  const computeVibe = useCallback(() => {
    if (activeVibe !== 'auto') return activeVibe;
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 7.5) return 'early-morning';
    if (hour >= 7.5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 16.5) return 'afternoon';
    if (hour >= 16.5 && hour < 18.5) return 'sunset';
    if (hour >= 18.5 && hour < 22.5) return 'night';
    return 'midnight';
  }, [activeVibe]);

  const effectiveVibe = computeVibe();

  // Apply vibe dataset attribute to document body & html
  useEffect(() => {
    document.documentElement.setAttribute('data-vibe', effectiveVibe);
    document.body.setAttribute('data-vibe', effectiveVibe);
  }, [effectiveVibe]);

  // Lock background body scroll when any modal is open
  useEffect(() => {
    if (activeModal) {
      document.body.classList.add('modal-open');
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [activeModal]);

  const openModal = useCallback((modalName, data = null) => {
    if (data) {
      setLightboxData(data);
    }
    setActiveModal(modalName);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setLightboxData(null);
  }, []);

  const openLightbox = useCallback((item) => {
    setLightboxData(item);
    setActiveModal('lightbox');
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxData(null);
    if (activeModal === 'lightbox') setActiveModal(null);
  }, [activeModal]);

  const showToast = useCallback((msg, duration = 3200) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(current => (current === msg ? null : current));
    }, duration);
  }, []);

  const triggerShankha = useCallback(() => {
    setShankhaActive(true);
    setTimeout(() => setShankhaActive(false), 3200);
  }, []);

  const enterSite = useCallback(() => {
    setHasEnteredSite(true);
    try {
      sessionStorage.setItem('mondal_bari_welcome_session_entered', 'true');
      localStorage.setItem('mondal_bari_welcome_entered', 'true');
    } catch (_) {}
    if (activeModal === 'welcome') {
      setActiveModal(null);
    }
  }, [activeModal]);

  const value = {
    activeModal,
    openModal,
    closeModal,
    lightboxData,
    modalData: lightboxData,
    openLightbox,
    closeLightbox,
    toastMessage,
    showToast,
    activeVibe,
    setActiveVibe,
    effectiveVibe,
    solarVibe: effectiveVibe,
    setSolarVibe: setActiveVibe,
    hasEnteredSite,
    enterSite,
    setSiteEntered: enterSite,
    shankhaActive,
    triggerShankha
  };

  return (
    <UIStateContext.Provider value={value}>
      {children}
    </UIStateContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIStateContext);
  if (!ctx) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return ctx;
}
