import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAudio } from '../../context/AudioContext';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { playlists } from '../../data/playlists';

export default function WelcomeModal() {
  const { lang, setLanguage } = useLanguage();
  const { playTrack } = useAudio();
  const { signInWithGoogle } = useAuth();
  const { activeModal, closeModal, setSiteEntered } = useUI();

  const [selectedLang, setSelectedLang] = useState('bn');
  const [selectedSound, setSelectedSound] = useState('yes');

  if (activeModal !== 'welcome') return null;

  const handleEnter = () => {
    setLanguage(selectedLang);
    setSiteEntered(true);
    closeModal();

    // Start with Mondal Bari Ambient / Dugga Elo if sound selected
    if (selectedSound === 'yes') {
      const initialTrack = playlists.durgaPuja?.tracks?.[0];
      if (initialTrack) {
        playTrack(initialTrack);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      handleEnter();
    } catch (e) {
      console.error('Google Sign In failed:', e);
    }
  };

  return (
    <div className="welcome-modal-overlay active" id="welcome-modal-overlay" role="dialog" aria-modal="true" aria-label="Language and Sound Preferences">
      <div className="welcome-modal-card">
        {/* Card Header */}
        <div className="welcome-header-center">
          <h2 className="welcome-card-title">মন্ডল বাড়ির পুজো ২০২৬</h2>
          <p className="welcome-card-subtitle">ভাষা ও শারদ আবহ নির্বাচন • উৎসব পোর্টালে স্বাগতম</p>
        </div>

        <div className="welcome-options-container">
          {/* 1. Language Preference Selection */}
          <div className="welcome-option-group">
            <label className="welcome-group-label">ভাষা নির্বাচন</label>
            <div className="welcome-choice-grid welcome-choice-lang">
              <button 
                type="button" 
                className={`welcome-choice-btn welcome-choice-lang-btn ${selectedLang === 'bn' ? 'active' : ''}`} 
                id="welcome-lang-bn" 
                onClick={() => setSelectedLang('bn')}
                aria-pressed={selectedLang === 'bn'}
              >
                <span className="choice-text">বাংলা</span>
                <span className="choice-check">✓</span>
              </button>
              <button 
                type="button" 
                className={`welcome-choice-btn welcome-choice-lang-btn ${selectedLang === 'en' ? 'active' : ''}`} 
                id="welcome-lang-en" 
                onClick={() => setSelectedLang('en')}
                aria-pressed={selectedLang === 'en'}
              >
                <span className="choice-text">English</span>
                <span className="choice-check">✓</span>
              </button>
            </div>
          </div>

          {/* 2. Ambient Audio & Sound Selection */}
          <div className="welcome-option-group">
            <label className="welcome-group-label">শারদ আবহ সঙ্গীত ও শব্দ</label>
            <div className="welcome-choice-grid welcome-choice-sound">
              <button 
                type="button" 
                className={`welcome-choice-btn ${selectedSound === 'yes' ? 'active' : ''}`} 
                id="welcome-sound-yes" 
                onClick={() => setSelectedSound('yes')}
                aria-pressed={selectedSound === 'yes'}
              >
                <span className="choice-main-text">শব্দসহ প্রবেশ</span>
                <span className="choice-check">✓</span>
              </button>
              <button 
                type="button" 
                className={`welcome-choice-btn ${selectedSound === 'no' ? 'active' : ''}`} 
                id="welcome-sound-no" 
                onClick={() => setSelectedSound('no')}
                aria-pressed={selectedSound === 'no'}
              >
                <span className="choice-main-text">শব্দহীন প্রবেশ</span>
                <span className="choice-check">✓</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Optional Google Sign-in Directly in Welcome Gate */}
        <div className="welcome-google-auth-wrap">
          <button 
            type="button" 
            className="welcome-google-btn" 
            id="btn-welcome-google-signin"
            onClick={handleGoogleSignIn}
          >
            <svg className="google-svg" viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Google দিয়ে সাইন ইন (ঐচ্ছিক)</span>
          </button>
        </div>

        {/* Enter Site Button */}
        <button 
          type="button" 
          className="welcome-enter-btn" 
          id="btn-welcome-enter"
          onClick={handleEnter}
        >
          <span className="enter-btn-text">উৎসব প্রাঙ্গণে প্রবেশ করুন</span>
        </button>
      </div>
    </div>
  );
}
