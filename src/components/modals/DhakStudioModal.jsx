import React, { useState } from 'react';
import { useUI } from '../../context/UIContext';
import { useAudio } from '../../context/AudioContext';
import { useLanguage } from '../../context/LanguageContext';
import { authenticLiveDhakParts, TRADITIONAL_BOLS } from '../../data/playlists';

export default function DhakStudioModal() {
  const { activeModal, closeModal } = useUI();
  const { playDhakBol } = useAudio();
  const { lang } = useLanguage();
  const [activeView, setActiveView] = useState('live'); // 'live' or 'synth'

  if (activeModal !== 'dhak') return null;

  return (
    <div className="modal-backdrop active" id="dhak-modal" role="dialog" aria-modal="true" aria-labelledby="dhak-modal-title">
      <div className="modal-card dhak-card">
        {/* Mobile Drawer Grab Handle */}
        <div className="drawer-notch hide-on-desktop" aria-hidden="true"></div>

        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-subtitle">TRADITIONAL BENGALI PERCUSSION</span>
            <h2 className="modal-title" id="dhak-modal-title">
              {lang === 'bn' ? 'ঢাকের বোল স্টুডিও' : 'DHAK DRUM STUDIO'}
            </h2>
          </div>
          <button type="button" className="close-btn" id="btn-close-dhak" aria-label="Close Dhak Studio" onClick={closeModal}>✕</button>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div className="dhak-view-switcher" role="tablist">
          <button 
            type="button" 
            className={`dhak-view-tab ${activeView === 'live' ? 'active' : ''}`} 
            onClick={() => setActiveView('live')}
            role="tab" 
            aria-selected={activeView === 'live'}
          >
            <span className="tab-title-wrap">
              <span className="tab-title-main">{lang === 'bn' ? 'আসল সাবেকি ঢাক' : 'Authentic Live Dhak'}</span>
              <span className="tab-title-sub">{lang === 'bn' ? '৬টি তিথির নিখুঁত বোল' : '6 Festival Movements'}</span>
            </span>
            <span className="tab-live-badge">লাইভ</span>
          </button>
          <button 
            type="button" 
            className={`dhak-view-tab ${activeView === 'synth' ? 'active' : ''}`} 
            onClick={() => setActiveView('synth')}
            role="tab" 
            aria-selected={activeView === 'synth'}
          >
            <span className="tab-title-wrap">
              <span className="tab-title-main">{lang === 'bn' ? 'ইন্টারেক্টিভ ড্রাম প্যাড' : 'Interactive Drum Studio'}</span>
              <span className="tab-title-sub">{lang === 'bn' ? 'নিজে বাজান ও তাল তুলুন' : 'Synthesizer & Pads'}</span>
            </span>
            <span className="tab-synth-badge">সিন্থ</span>
          </button>
        </div>

        <div className="dhak-modal-content">
          {activeView === 'live' ? (
            <div className="dhak-view-container active">
              <div className="live-parts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', padding: '1rem 0' }}>
                {(authenticLiveDhakParts || []).map((part, idx) => (
                  <div 
                    key={part.id || idx} 
                    className="live-part-card"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.04)', 
                      border: '1px solid rgba(255, 207, 64, 0.25)', 
                      borderRadius: '16px', 
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="live-part-num-badge" style={{ background: '#ffcf40', color: '#160308', padding: '2px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {part.tag || `পর্ব ${idx + 1}`}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>{part.bpm || '120'} BPM</span>
                    </div>
                    <h4 style={{ margin: '0.25rem 0', color: '#ffcf40', fontSize: '1.1rem' }}>
                      {lang === 'bn' ? part.title_bn : part.title_en}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.75)', fontStyle: 'italic' }}>
                      {part.bol}
                    </p>
                    <button 
                      type="button" 
                      className="dhak-action-btn"
                      onClick={() => playDhakBol('dha')}
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.6rem 1rem',
                        background: 'linear-gradient(135deg, #d97706, #b45309)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <span>🥁 {lang === 'bn' ? 'বোল বাজান' : 'Play Movement'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="dhak-view-container active" style={{ padding: '1rem 0' }}>
              <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1.5rem' }}>
                {lang === 'bn' ? 'প্যাডে ট্যাপ করে ঐতিহ্যবাহী ঢাকের বিভিন্ন বোল বাজান' : 'Tap on the pads to play authentic Dhak drum bols'}
              </p>
              <div className="drum-pads-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {(TRADITIONAL_BOLS || [
                  { key: 'dha', name_bn: 'ধা (Dha)', name_en: 'Dha' },
                  { key: 'dhin', name_bn: 'ধিন (Dhin)', name_en: 'Dhin' },
                  { key: 'ta', name_bn: 'তা (Ta)', name_en: 'Ta' },
                  { key: 'na', name_bn: 'না (Na)', name_en: 'Na' },
                  { key: 'kash', name_bn: 'কাঁসি (Kash)', name_en: 'Kash' },
                  { key: 'jhan', name_bn: 'ঝাঁঝ (Jhan)', name_en: 'Jhan' }
                ]).map((bol) => (
                  <button 
                    key={bol.key} 
                    type="button" 
                    className="drum-pad-btn"
                    onClick={() => playDhakBol(bol.key)}
                    style={{
                      aspectRatio: '1',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 207, 64, 0.4)',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      color: '#ffcf40',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>🥁</span>
                    <span>{lang === 'bn' ? bol.name_bn : bol.name_en}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
