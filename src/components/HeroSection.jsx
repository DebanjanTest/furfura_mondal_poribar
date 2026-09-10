import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import { formatNumber } from '../utils/i18n';

export default function HeroSection() {
  const { lang, t } = useLanguage();
  const { openModal } = useUI();

  // Target: Mahalaya, Oct 10, 2026, 05:00:00 IST
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date('2026-10-10T05:00:00+05:30').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDigits = (val) => {
    const s = String(val).padStart(2, '0');
    return formatNumber(s, lang);
  };

  return (
    <section className="hero-viewport-section" id="hero-section">
      {/* MAIN HERO: CALLIGRAPHY & COUNTDOWN SYSTEM */}
      <main className="hero-container" role="main">
        {/* Heritage Bengali Title */}
        <h1 className="hero-title-bengali" id="hero-title">
          <span className="hero-word-top">{lang === 'bn' ? 'পুজো' : 'PUJO'}</span>
          <span className="hero-word-bottom">{lang === 'bn' ? 'আসছে' : 'ASCHE'}</span>
        </h1>

        {/* Mondol Barir Pujo Sub-Tagline */}
        <div className="hero-subtag">
          <span className="subtag-dot">•</span>
          <span>{lang === 'bn' ? 'মন্ডল বাড়ির পুজো ২০২৬ • ১৯৯৭ সাল থেকে অনুষ্ঠিত ৩০তম বর্ষ' : 'Mondal Bari Durga Puja 2026 • 30th Year Celebration since 1997'}</span>
          <span className="subtag-dot">•</span>
        </div>

        {/* High-End 4-Unit Festive Countdown Display */}
        <div 
          className="festive-countdown-card" 
          id="btn-countdown-details" 
          role="button" 
          tabIndex={0} 
          title="Click to inspect Mondol Barir Pujo 2026 Schedule"
          onClick={() => openModal('pujoInfo')}
          style={{ cursor: 'pointer' }}
        >
          <div className="countdown-units-grid">
            <div className="countdown-unit-box">
              <div className="unit-val-wrap">
                <span className="unit-val" id="countdown-days-val">{formatDigits(timeLeft.days)}</span>
              </div>
              <span className="unit-label">{lang === 'bn' ? 'দিন' : 'Days'}</span>
            </div>
            <div className="countdown-colon">:</div>
            <div className="countdown-unit-box">
              <div className="unit-val-wrap">
                <span className="unit-val" id="countdown-hours-val">{formatDigits(timeLeft.hours)}</span>
              </div>
              <span className="unit-label">{lang === 'bn' ? 'ঘণ্টা' : 'Hours'}</span>
            </div>
            <div className="countdown-colon">:</div>
            <div className="countdown-unit-box">
              <div className="unit-val-wrap">
                <span className="unit-val" id="countdown-mins-val">{formatDigits(timeLeft.minutes)}</span>
              </div>
              <span className="unit-label">{lang === 'bn' ? 'মিনিট' : 'Mins'}</span>
            </div>
            <div className="countdown-colon">:</div>
            <div className="countdown-unit-box">
              <div className="unit-val-wrap">
                <span className="unit-val" id="countdown-secs-val">{formatDigits(timeLeft.seconds)}</span>
              </div>
              <span className="unit-label">{lang === 'bn' ? 'সেকেন্ড' : 'Secs'}</span>
            </div>
          </div>
          <div className="countdown-footer-badge">
            <span id="countdown-sub-label" className="countdown-label-text">
              {lang === 'bn' ? 'শুভ মহালয়া: ১০ অক্টোবর ২০২৬ • নির্ঘণ্ট ও সূচি' : 'Subho Mahalaya: 10 Oct 2026 • Full Schedule'}
            </span>
            <span className="countdown-arrow-indicator" aria-hidden="true">›</span>
          </div>
        </div>

        {/* Floating Sound & Story Action Bar (Mobile & Desktop) */}
        <div className="floating-sound-triggers">
          <button 
            type="button" 
            className="glass-pill sound-trigger-pill story-sparkle-pill" 
            id="btn-trig-story-gen" 
            title="Generate Instagram Story (Key I)"
            onClick={() => openModal('story')}
          >
            <span>{lang === 'bn' ? 'শারদীয় স্টোরি কার্ড' : 'Festive Story Card'}</span>
          </button>
        </div>
      </main>

      {/* Elegant Animated Scroll Cue */}
      <a href="#invitation-section" className="hero-scroll-indicator" id="btn-scroll-to-gallery" aria-label="স্ক্রোল করে নিচে দেখুন">
        <div className="scroll-mouse-icon" aria-hidden="true">
          <span className="scroll-wheel-dot"></span>
        </div>
        <span className="scroll-prompt-text">
          {lang === 'bn' ? 'স্ক্রোল করে সাবেকি উৎসব পরিক্রমা দর্শন করুন' : 'Scroll down to explore heritage celebration'}
        </span>
        <span className="scroll-chevron-bounce">↓</span>
      </a>
    </section>
  );
}
