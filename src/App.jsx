import React, { useEffect } from 'react';
import { useSectionScrollLocking } from './hooks/useSectionScrollLocking';
import { useLanguage } from './context/LanguageContext';
import { useUI } from './context/UIContext';
import { useAudio } from './context/AudioContext';

import BackgroundSystem from './components/BackgroundSystem';
import DynamicIsland from './components/DynamicIsland';
import HeroSection from './components/HeroSection';
import InvitationSection from './components/InvitationSection';
import PhotoRiver from './components/PhotoRiver';
import OnnotaSection from './components/OnnotaSection';
import GrandGallery from './components/GrandGallery';
import PonytailScrollspy from './components/PonytailScrollspy';
import PlayerDock from './components/PlayerDock';
import ShankhaRippleHUD from './components/ShankhaRippleHUD';

// Modals
import WelcomeModal from './components/modals/WelcomeModal';
import PlaylistsModal from './components/modals/PlaylistsModal';
import DhakStudioModal from './components/modals/DhakStudioModal';
import PujoInfoModal from './components/modals/PujoInfoModal';
import StoryGeneratorModal from './components/modals/StoryGeneratorModal';
import LightboxModal from './components/modals/LightboxModal';
import GoogleSigninModal from './components/modals/GoogleSigninModal';
import ShortcutsModal from './components/modals/ShortcutsModal';

export default function App() {
  useSectionScrollLocking();
  const { lang } = useLanguage();
  const { openModal, closeModal, activeModal, toastMessage } = useUI();
  const { togglePlay, playShankha } = useAudio();

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore in input fields
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          openModal('playlists');
          break;
        case 'd':
        case 'D':
          e.preventDefault();
          openModal('dhak');
          break;
        case 's':
        case 'S':
          e.preventDefault();
          playShankha();
          break;
        case 'i':
        case 'I':
          e.preventDefault();
          openModal('story');
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          document.getElementById('gallery-section')?.scrollIntoView({ behavior: 'smooth' });
          break;
        case 'Escape':
          closeModal();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, openModal, closeModal, playShankha]);

  return (
    <div id="app" className="app-wrapper">
      {/* Background with Three.js / R3F Canvas */}
      <BackgroundSystem />

      {/* Floating Universal Dynamic Island */}
      <DynamicIsland />

      {/* Section 1: Hero Viewport */}
      <HeroSection />

      {/* Section 2: Formal Invitation Letterhead */}
      <InvitationSection />

      {/* Section 3: Infinite Multi-Row Photo River */}
      <PhotoRiver />

      {/* Section 4: Public Uploads (Others by Onnota) */}
      <OnnotaSection />

      {/* Section 5: Grand Heritage Gallery & Community Photo Archive */}
      <GrandGallery />

      {/* Side: Ponytail Live Focal-Coverage Scrollspy */}
      <PonytailScrollspy />

      {/* Bottom: Desktop Floating Glass Dock & Mobile Drawer */}
      <PlayerDock />

      {/* Fullscreen Sacred Shankha Ripple Animation */}
      <ShankhaRippleHUD />

      {/* All Modal Overlays */}
      <WelcomeModal />
      <PlaylistsModal />
      <DhakStudioModal />
      <PujoInfoModal />
      <StoryGeneratorModal />
      <LightboxModal />
      <GoogleSigninModal />
      <ShortcutsModal />

      {/* Toast Notice */}
      {toastMessage && (
        <div className="toast-notification active" style={{
          position: 'fixed',
          bottom: '5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(18, 2, 6, 0.94)',
          border: '1px solid #ffcf40',
          color: '#ffcf40',
          padding: '0.65rem 1.5rem',
          borderRadius: '30px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
          zIndex: 9999,
          fontSize: '0.95rem',
          fontWeight: '500'
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
