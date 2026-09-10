import React from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAudio } from '../context/AudioContext.jsx';
import { useUI } from '../context/UIContext.jsx';

export function ExecutiveFestiveBar() {
  const { t, lang } = useLanguage();
  const { soundFX } = useAudio();
  const { openModal } = useUI();

  return (
    <section className="full-breadth-festive-bar" id="full-breadth-bar">
      <div className="executive-bar-container">
        {/* Left Heritage Brand */}
        <div className="bar-brand-segment">
          <span className="bar-diya-glow">🪔</span>
          <span className="bar-title-strong">{t('brand_title', 'মন্ডল বাড়ির পুজো ২০২৬')}</span>
          <span className="bar-bullet-dot">•</span>
          <span className="bar-sub-heritage">{t('brand_heritage_desc', '১৯৯৭ সাল থেকে প্রতিষ্ঠিত ৩০তম বর্ষ')}</span>
        </div>

        {/* Center Schedule Highlight */}
        <div className="bar-schedule-segment">
          <span className="bar-cal-icon">🗓️</span>
          <span className="bar-dates-text">
            {lang === 'bn' 
              ? 'মহালয়া: ১০ অক্টো • মহাষ্টমী ও সন্ধিপূজা: ১৮ অক্টো | 📍 নাটমন্দির, ফুরফুরা' 
              : 'Mahalaya: 10 Oct • Mahashtami & Sandhipuja: 18 Oct | 📍 Natmandir, Furfura'}
          </span>
        </div>

        {/* Right Quick Interactive Actions */}
        <div className="bar-actions-segment">
          <button
            type="button"
            className="bar-action-chip"
            onClick={() => soundFX.shankha()}
            title={t('shankha_sound', 'মঙ্গল শঙ্খধ্বনি')}
          >
            <span>🐚</span>
            <span className="action-txt">{t('shankha_sound', 'শাঁখ')}</span>
          </button>

          <button
            type="button"
            className="bar-action-chip"
            onClick={() => openModal('dhak')}
            title={t('dhak_studio', 'সাবেকি ঢাকের বোল')}
          >
            <span>🥁</span>
            <span className="action-txt">{t('dhak_studio', 'ঢাক')}</span>
          </button>

          <button
            type="button"
            className="bar-action-chip"
            onClick={() => openModal('playlists')}
            title={t('island_quick_radio', 'পূজা রেডিও')}
          >
            <span>📻</span>
            <span className="action-txt">{t('island_quick_radio', 'রেডিও')}</span>
          </button>

          <a href="#photo-river-section" className="bar-action-chip bar-explore-cta">
            <span>↓</span>
            <span className="action-txt">{lang === 'bn' ? 'ছবি ও সৃষ্টি দেখুন' : 'Explore Memories'}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
