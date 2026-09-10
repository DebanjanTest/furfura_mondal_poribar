import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAudio } from '../context/AudioContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function Header() {
  const { t, lang, setLanguage } = useLanguage();
  const { soundFX } = useAudio();
  const { openModal, activeVibe, setActiveVibe } = useUI();
  const { currentUser } = useAuth();

  const [vibeMenuOpen, setVibeMenuOpen] = useState(false);

  const toggleLang = () => {
    setLanguage(lang === 'bn' ? 'en' : 'bn');
  };

  return (
    <header className="header-bar" role="banner">
      <div className="header-left">
        <div className="status-badge" title={t('live_visitors', 'লাইভ দর্শনার্থী ও ভক্তবৃন্দ')}>
          <span className="live-dot"></span>
          <span className="live-visitors-count">54</span>
          <span className="status-text">{t('brand_heritage_badge', '১৯৯৭ সাল থেকে প্রতিষ্ঠিত')}</span>
        </div>
      </div>

      <div className="header-right">
        {/* Atmosphere Vibe Selector Menu */}
        <div className="vibe-dropdown-wrapper">
          <button
            type="button"
            className="vibe-pill"
            id="vibe-selector-btn"
            onClick={() => setVibeMenuOpen(!vibeMenuOpen)}
            aria-expanded={vibeMenuOpen}
          >
            <span className="vibe-icon">🌤️</span>
            <span className="vibe-label">{t(`vibe_${activeVibe}`, 'আবহাওয়া')}</span>
            <span className="dropdown-arrow">▼</span>
          </button>

          {vibeMenuOpen && (
            <div className="vibe-menu" id="vibe-menu">
              {['auto', 'early-morning', 'morning', 'afternoon', 'sunset', 'night', 'midnight'].map((vKey) => (
                <button
                  key={vKey}
                  type="button"
                  className={`vibe-item ${activeVibe === vKey ? 'active' : ''}`}
                  onClick={() => {
                    setActiveVibe(vKey);
                    setVibeMenuOpen(false);
                  }}
                >
                  <span className="vibe-item-name">{t(`vibe_${vKey}`, vKey)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Floating Quick Soundboard Triggers */}
        <button
          type="button"
          className="sound-trigger-pill shankha-trigger"
          onClick={() => soundFX.shankha()}
          title={t('shankha_sound', 'মঙ্গল শঙ্খধ্বনি')}
        >
          <span className="trigger-icon">🐚</span>
          <span className="trigger-text">{t('shankha_sound', 'শঙ্খধ্বনি')}</span>
        </button>

        <button
          type="button"
          className="sound-trigger-pill dhak-trigger"
          onClick={() => openModal('dhak')}
          title={t('dhak_studio', 'সাবেকি ঢাকের বোল')}
        >
          <span className="trigger-icon">🥁</span>
          <span className="trigger-text">{t('dhak_studio', 'ঢাকের বোল')}</span>
        </button>

        {/* Story Card Generator Pill */}
        <button
          type="button"
          className="sound-trigger-pill story-trigger"
          onClick={() => openModal('story')}
          title={t('photo_story', 'শারদীয় স্টোরি কার্ড')}
        >
          <span className="trigger-icon">📸</span>
          <span className="trigger-text">{t('photo_story', 'স্টোরি কার্ড')}</span>
        </button>

        {/* Official Instagram Link */}
        <a
          href="https://www.instagram.com/furfura_mondal_poribar?igsh=d3BvbzY5NTI5Z2hp"
          target="_blank"
          rel="noopener noreferrer"
          className="insta-pill-btn"
          title="@furfura_mondal_poribar"
        >
          <span className="insta-icon">📷</span>
          <span className="insta-text">@furfura_mondal_poribar</span>
        </a>

        {/* Language Switcher */}
        <button
          type="button"
          className="lang-switch-btn"
          onClick={toggleLang}
          aria-label="Switch Language"
        >
          <span className="lang-icon">🌐</span>
          <span className="lang-text">{lang === 'bn' ? 'English' : 'বাংলা'}</span>
        </button>

        {/* Account Button */}
        <button
          type="button"
          className="auth-btn-pill"
          onClick={() => openModal('google-signin')}
        >
          {currentUser ? (
            <div className="auth-avatar-chip">
              <img src={currentUser.photoURL || '/favicon.png'} alt="Avatar" className="user-thumb" />
              <span className="user-name-short">{currentUser.displayName?.split(' ')[0] || 'User'}</span>
            </div>
          ) : (
            <span className="auth-signin-text">{t('google_signin_btn', 'Google সাইন ইন')}</span>
          )}
        </button>
      </div>
    </header>
  );
}
