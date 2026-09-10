import React, { useState } from 'react';
import { useAudio } from '../context/AudioContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

export default function DynamicIsland() {
  const { isPlaying, currentTrack, togglePlay } = useAudio();
  const { lang, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();
  const { openModal, solarVibe, setSolarVibe } = useUI();
  const [expanded, setExpanded] = useState(false);

  const toggleLang = () => {
    setLanguage(lang === 'bn' ? 'en' : 'bn');
  };

  const scrollToGallery = () => {
    const el = document.getElementById('gallery-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setExpanded(false);
  };

  return (
    <div className="universal-dynamic-island-container" id="universal-dynamic-island-container">
      <div className={`dynamic-island ${expanded ? 'expanded' : ''}`} id="dynamic-island" role="region" aria-label="Mondol Barir Pujo Dynamic Island">
        
        {/* Island State A: Default / Idle Pill */}
        <div 
          className="island-state island-idle" 
          id="island-idle-state"
          style={{ display: isPlaying ? 'none' : 'flex' }}
        >
          <div 
            className="island-left" 
            id="island-idle-tap-target" 
            title="মন্ডল বাড়ির পুজো — ঐতিহ্য ও নির্ঘণ্ট"
            onClick={() => openModal('pujoInfo')}
            style={{ cursor: 'pointer' }}
          >
            <span className="island-emblem-dot" aria-hidden="true">•</span>
            <div className="island-brand-text">
              <span className="island-title">{lang === 'bn' ? 'মন্ডল বাড়ির পুজো' : 'Mondal Bari Pujo'}</span>
            </div>
          </div>
          <div className="island-right">
            {/* Optional Google Sign-In Pill */}
            {!user ? (
              <button 
                type="button" 
                className="island-auth-btn" 
                id="island-google-auth-btn" 
                title="Google দিয়ে সাইন ইন (ঐচ্ছিক)"
                onClick={() => openModal('googleSignin')}
              >
                <svg className="google-svg-icon" viewBox="0 0 24 24" width="13" height="13">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span className="auth-btn-text" id="island-auth-label">{lang === 'bn' ? 'সাইন ইন' : 'Sign In'}</span>
              </button>
            ) : (
              <div 
                className="island-user-pill" 
                id="island-user-pill" 
                title={user.displayName || 'User Profile'}
                style={{ display: 'flex', cursor: 'pointer' }}
                onClick={() => setExpanded(prev => !prev)}
              >
                <img 
                  className="island-user-avatar" 
                  id="island-user-avatar" 
                  src={user.photoURL || '/favicon.png'} 
                  alt="User Profile" 
                  width="22" 
                  height="22" 
                />
              </div>
            )}

            {/* Fast Language Toggle Pill */}
            <button 
              type="button" 
              className="island-lang-pill" 
              id="btn-toggle-lang" 
              title="Toggle Language (বাংলা / English)" 
              aria-label="Change Language" 
              onClick={toggleLang}
            >
              <span id="lang-current-label">{lang === 'bn' ? 'বাংলা' : 'English'}</span>
            </button>

            {/* Expand Quick Hub Menu Button */}
            <button 
              type="button" 
              className="island-expand-btn" 
              id="btn-island-expand" 
              title="Open Quick Action Menu" 
              aria-label="Toggle Quick Hub"
              onClick={() => setExpanded(prev => !prev)}
            >
              <span className={`island-chevron-icon ${expanded ? 'rotated' : ''}`} id="island-chevron">
                {expanded ? '▴' : '▾'}
              </span>
            </button>
          </div>
        </div>

        {/* Island State B: Active Audio / Ambient / Dhak Playing Pill */}
        <div 
          className="island-state island-active" 
          id="island-active-state"
          style={{ display: isPlaying ? 'flex' : 'none' }}
        >
          <div 
            className="island-left" 
            id="island-active-tap-target" 
            title="Click to open full player"
            onClick={() => openModal('playlists')}
            style={{ cursor: 'pointer' }}
          >
            <div className="island-art-wrap">
              <img 
                id="island-art-img" 
                className="island-art-thumb spinning" 
                src={currentTrack?.thumb || '/favicon.png'} 
                alt="Now Playing Artwork" 
                width="28" 
                height="28" 
              />
            </div>
            <div className="island-track-meta">
              <div className="island-track-title" id="island-track-title">
                {currentTrack ? (lang === 'bn' ? currentTrack.title_bn : currentTrack.title_en) : 'Dugga Elo'}
              </div>
              <div className="island-track-sub">
                <div className="island-eq-bars" aria-hidden="true">
                  <span className="island-eq-bar"></span>
                  <span className="island-eq-bar"></span>
                  <span className="island-eq-bar"></span>
                </div>
                <span id="island-artist-name">
                  {currentTrack?.artist || (lang === 'bn' ? 'মন্ডল বাড়ি আবহ' : 'Mondal Bari Ambient')}
                </span>
              </div>
            </div>
          </div>
          <div className="island-right">
            {/* Island Play / Pause */}
            <button 
              type="button" 
              className="island-ctrl-btn" 
              id="island-btn-play-pause" 
              aria-label="Play or Pause Audio"
              onClick={togglePlay}
            >
              <svg id="island-icon-play" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ display: isPlaying ? 'none' : 'block' }}>
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg id="island-icon-pause" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ display: isPlaying ? 'block' : 'none' }}>
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            </button>
            {/* Fast Language Switcher in Active Mode */}
            <button 
              type="button" 
              className="island-lang-pill-mini" 
              id="btn-toggle-lang-active" 
              title="ভাষা পরিবর্তন / Switch Language" 
              aria-label="Change Language"
              onClick={toggleLang}
            >
              <span id="lang-active-label">{lang === 'bn' ? 'বাংলা' : 'EN'}</span>
            </button>
            {/* Expand Quick Hub Button */}
            <button 
              type="button" 
              className="island-expand-btn" 
              id="btn-island-active-expand" 
              title="Open Quick Action Menu" 
              aria-label="Toggle Quick Hub"
              onClick={() => setExpanded(prev => !prev)}
            >
              <span className="island-chevron-icon">{expanded ? '▴' : '▾'}</span>
            </button>
          </div>
        </div>

        {/* Island Dropdown Quick Action Hub (Expanded State) */}
        <div 
          className="island-quick-drawer" 
          id="island-quick-drawer"
          style={{ display: expanded ? 'block' : 'none' }}
        >
          {/* Optional Google User Account Banner */}
          <div className="island-account-section" id="island-account-section">
            <div className="island-account-box" id="island-account-box">
              <div className="account-left">
                <div className="account-avatar-wrap" id="account-avatar-wrap">
                  {user?.photoURL ? (
                    <img className="account-user-img" id="drawer-user-img" src={user.photoURL} alt="User Avatar" style={{ display: 'block' }} />
                  ) : (
                    <svg className="account-guest-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  )}
                </div>
                <div className="account-info">
                  <span className="account-name" id="drawer-user-name">
                    {user?.displayName || (lang === 'bn' ? 'ভক্ত ও দর্শনার্থী' : 'Guest & Devotee')}
                  </span>
                  <span className="account-sub" id="drawer-user-sub">
                    {user?.email || (lang === 'bn' ? 'ঐচ্ছিক Google অ্যাকাউন্ট' : 'Optional Google Account')}
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                className="drawer-auth-btn" 
                id="drawer-btn-auth"
                onClick={() => {
                  if (user) {
                    signOut();
                  } else {
                    openModal('googleSignin');
                  }
                }}
              >
                {!user ? (
                  <>
                    <svg className="google-svg-icon" viewBox="0 0 24 24" width="13" height="13">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span id="drawer-auth-btn-text">{lang === 'bn' ? 'Google সাইন ইন' : 'Google Sign In'}</span>
                  </>
                ) : (
                  <span id="drawer-auth-btn-text">{lang === 'bn' ? 'সাইন আউট' : 'Sign Out'}</span>
                )}
              </button>
            </div>
          </div>

          <div className="island-quick-grid">
            <button 
              type="button" 
              className="island-quick-item" 
              id="island-quick-radio" 
              aria-label="Open Radio"
              onClick={() => { openModal('playlists'); setExpanded(false); }}
            >
              <span className="island-quick-label">{lang === 'bn' ? 'পূজা রেডিও' : 'Puja Radio'}</span>
            </button>
            <button 
              type="button" 
              className="island-quick-item" 
              id="island-quick-particles" 
              aria-label="Dhak Studio"
              onClick={() => { openModal('dhak'); setExpanded(false); }}
            >
              <span className="island-quick-label">{lang === 'bn' ? 'ঢাকের বোল' : 'Dhak Studio'}</span>
            </button>
            <button 
              type="button" 
              className="island-quick-item" 
              id="island-quick-story" 
              aria-label="Open Story Generator"
              onClick={() => { openModal('story'); setExpanded(false); }}
            >
              <span className="island-quick-label">{lang === 'bn' ? 'স্টোরি কার্ড' : 'Story Card'}</span>
            </button>
            <button 
              type="button" 
              className="island-quick-item" 
              id="island-quick-gallery" 
              aria-label="Scroll to Photo Gallery"
              onClick={scrollToGallery}
            >
              <span className="island-quick-label">{lang === 'bn' ? 'ফটো গ্যালারি' : 'Photo Gallery'}</span>
            </button>
          </div>
          
          {/* Language Quick Selector inside Island */}
          <div className="island-vibe-section island-lang-section">
            <span className="island-vibe-title">{lang === 'bn' ? 'ভাষা পরিবর্তন (Language):' : 'Switch Language:'}</span>
            <div className="island-vibe-chips">
              <button 
                type="button" 
                className={`island-vibe-chip ${lang === 'bn' ? 'active' : ''}`} 
                id="island-lang-bn" 
                onClick={() => setLanguage('bn')}
              >
                বাংলা
              </button>
              <button 
                type="button" 
                className={`island-vibe-chip ${lang === 'en' ? 'active' : ''}`} 
                id="island-lang-en" 
                onClick={() => setLanguage('en')}
              >
                English
              </button>
            </div>
          </div>

          {/* Atmosphere Quick Selector inside Island */}
          <div className="island-vibe-section">
            <span className="island-vibe-title">{lang === 'bn' ? 'আবহাওয়া পরিবর্তন (Atmosphere Vibe):' : 'Atmosphere Vibe:'}</span>
            <div className="island-vibe-chips">
              <button 
                type="button" 
                className={`island-vibe-chip ${solarVibe === 'morning' ? 'active' : ''}`} 
                onClick={() => setSolarVibe('morning')}
              >
                🌅 {lang === 'bn' ? 'সকাল (Morning)' : 'Morning'}
              </button>
              <button 
                type="button" 
                className={`island-vibe-chip ${solarVibe === 'night' ? 'active' : ''}`} 
                onClick={() => setSolarVibe('night')}
              >
                🌙 {lang === 'bn' ? 'রাত (Night)' : 'Night'}
              </button>
              <button 
                type="button" 
                className={`island-vibe-chip ${solarVibe === 'auto' ? 'active' : ''}`} 
                onClick={() => setSolarVibe('auto')}
              >
                ⚡ {lang === 'bn' ? 'অটো (Auto)' : 'Auto'}
              </button>
            </div>
          </div>

          {/* Quick Link to Pujo Info & Schedule */}
          <button 
            type="button" 
            className="island-heritage-banner" 
            id="island-quick-heritage"
            onClick={() => { openModal('pujoInfo'); setExpanded(false); }}
          >
            <div className="island-banner-text">
              <strong>{lang === 'bn' ? 'মন্ডল বাড়ির পুজো ও নির্ঘণ্ট' : 'Mondal Bari Puja & Schedule'}</strong>
              <span>{lang === 'bn' ? '১৯৯৭ সাল থেকে প্রতিষ্ঠিত ঐতিহ্য, সম্পূর্ণ পূজার সূচি ও ফটো গ্যালারি' : '30th Year Heritage celebration since 1997, full schedule & photo gallery'}</span>
            </div>
            <span className="island-banner-arrow">›</span>
          </button>
        </div>

      </div>
    </div>
  );
}
