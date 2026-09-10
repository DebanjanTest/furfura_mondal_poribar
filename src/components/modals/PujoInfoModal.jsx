import React from 'react';
import { useUI } from '../../context/UIContext';
import { useLanguage } from '../../context/LanguageContext';
import { nativePujoData } from '../../data/playlists';

export default function PujoInfoModal() {
  const { activeModal, closeModal } = useUI();
  const { lang } = useLanguage();

  if (activeModal !== 'pujoInfo') return null;

  const dates = nativePujoData.dates2026 || [];
  const highlights = nativePujoData.highlights || [];

  return (
    <div 
      className="modal-backdrop active" 
      id="pujo-info-modal" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="pujo-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="modal-card slideover-card" onClick={(e) => e.stopPropagation()}>
        {/* Mobile Drawer Grab Handle */}
        <div className="drawer-notch hide-on-desktop" aria-hidden="true"></div>

        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-subtitle">BONEDI BARI HERITAGE • EST. 1997</span>
            <h2 className="modal-title" id="pujo-modal-title">
              {lang === 'bn' ? 'মন্ডল বাড়ির পুজো ও নির্ঘণ্ট ২০২৬' : 'MONDAL BARIR PUJO & SCHEDULE 2026'}
            </h2>
          </div>
          <button 
            type="button" 
            className="close-btn" 
            id="btn-close-pujo-info" 
            aria-label="Close Modal" 
            onClick={closeModal}
          >
            ✕
          </button>
        </div>

        <div className="modal-body-scroll" id="pujo-modal-scroll-body">
          {/* Mondol Bari Heritage Welcome Banner */}
          <div className="heritage-intro-banner">
            <div className="heritage-intro-badge">
              {lang === 'bn' ? '১৯৯৭ সাল থেকে প্রতিষ্ঠিত ঐতিহ্য' : 'Heritage Tradition Established in 1997'}
            </div>
            <h3 className="heritage-intro-title">
              {lang === 'bn' ? 'মন্ডল বাড়ির দুর্গাপূজা ২০২৬ — ঐতিহ্য, ভক্তি ও মিলনমেলা' : 'Mondal Bari Durga Puja 2026 — Devotion, Heritage & Union'}
            </h3>
            <p className="heritage-intro-text">
              {lang === 'bn' 
                ? '১৯৯৭ সাল থেকে নিষ্ঠা ও শ্রদ্ধার সাথে চলে আসা আমাদের মন্ডল বাড়ির পুজো কেবল একটি ধর্মীয় আচার নয়, এটি পরিবার, আত্মীয়-স্বজন ও ভক্তদের মিলনমেলা। সাবেকি একচালা ডাকের সাজের প্রতিমা, কূলপুরোহিতের বিশুদ্ধ চণ্ডীপাঠ, ১০৮ পদ্ম ও প্রদীপে সন্ধিপূজা, আর নাটমন্দির কাঁপানো ঐতিহ্যবাহী ঢাকের বোলে প্রতিবছর ঘরে ফিরে আসেন ঘরের মেয়ে মা দুর্গা।' 
                : 'Since 1997, Mondal Bari Durga Puja has been celebrated with devotion and family heritage. Featuring traditional Daaker Saaj pratima, pure Chandipath, Sandhi Puja with 108 lotuses and lamps, and resonant traditional Dhak rhythms.'}
            </p>
          </div>

          {/* Instagram Connect Banner */}
          <div className="instagram-banner">
            <div className="insta-banner-left">
              <div className="insta-title">Follow Furfura Mondol Poribar on Instagram</div>
              <div className="insta-sub">Live pandal darshan, anjali timings, dhunuchi reels & festival updates</div>
            </div>
            <div className="insta-banner-right">
              <a 
                href="https://www.instagram.com/furfura_mondal_poribar?igsh=d3BvbzY5NTI5Z2hp" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="insta-btn"
              >
                <span>@furfura_mondal_poribar</span>
              </a>
            </div>
          </div>

          {/* Puja Schedule & Rituals Section */}
          <div className="section-block pujo-schedule-section-block">
            <div className="schedule-header-row">
              <h4 className="section-title">
                <span className="title-icon">🗓️</span>
                <span>{lang === 'bn' ? 'শ্রীশ্রী দুর্গাপূজা নির্ঘণ্ট ও তিথি ২০২৬' : 'Sri Sri Durga Puja 2026 Schedule & Rituals'}</span>
              </h4>
              <span className="schedule-badge-pill">
                {lang === 'bn' ? '৬টি প্রধান তিথি' : '6 Sacred Days'}
              </span>
            </div>

            <div className="timeline-list" id="pujo-timeline-list">
              {dates.map((d, idx) => {
                const isSpecial = d.id === 'astami' || d.id === 'navami';
                const dayText = lang === 'bn' ? d.bengaliDay : (d.englishDay || d.bengaliDay);
                const dateText = lang === 'bn' ? d.date : (d.englishDate || d.date);
                const ritualText = lang === 'bn' ? d.rituals : (d.englishRituals || d.rituals);

                return (
                  <div key={d.id || idx} className={`timeline-item ${isSpecial ? 'highlight-item' : ''}`}>
                    <div className="timeline-left">
                      <div className="timeline-day-row">
                        <span className="timeline-day">{dayText}</span>
                        {isSpecial && (
                          <span className="timeline-special-tag">
                            {d.id === 'astami' 
                              ? (lang === 'bn' ? '★ সন্ধিপূজা ও ১০৮ পদ্ম' : '★ Sandhi Puja & 108 Lotuses')
                              : (lang === 'bn' ? '★ ধুনুচি আরতি ও হোম' : '★ Dhunuchi Aarti & Homa')
                            }
                          </span>
                        )}
                      </div>
                      <span className="timeline-note">{ritualText}</span>
                    </div>
                    <span className="timeline-date">{dateText}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Heritage Highlights Section */}
          <div className="section-block">
            <h4 className="section-title">
              <span className="title-icon">🪔</span>
              <span>{lang === 'bn' ? 'পুজোর বিশেষ আকর্ষণ ও সাবেকি প্রথা' : 'Heritage Highlights & Traditions'}</span>
            </h4>
            <div className="highlights-grid" id="pujo-highlights-grid">
              {highlights.map((h, idx) => {
                const titleText = lang === 'bn' ? h.title : (h.englishTitle || h.title);
                const descText = lang === 'bn' ? h.desc : (h.englishDesc || h.desc);
                return (
                  <div key={idx} className="highlight-card">
                    <div className="highlight-card-header">
                      <span className="highlight-num-badge">0{idx + 1}</span>
                      <h5 className="highlight-title">{titleText}</h5>
                    </div>
                    <p className="highlight-desc">{descText}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Location & Completion Footer */}
          <div className="pujo-info-footer-card">
            <div className="pujo-location-wrap">
              <span className="location-pin">📍</span>
              <div className="location-text">
                <span className="location-title">{lang === 'bn' ? 'ফুরফুরা মণ্ডল পরিবার নাটমন্দির' : 'Furfura Mondol Poribar Natmandir'}</span>
                <span className="location-sub">{lang === 'bn' ? 'ফুরফুরা, কাজীপুর, হুগলী, পশ্চিমবঙ্গ' : 'Furfura, Kazipur, Hooghly, West Bengal'}</span>
              </div>
            </div>
            <button type="button" className="btn-modal-done" onClick={closeModal}>
              {lang === 'bn' ? 'সূচি দেখা সম্পন্ন ✓' : 'Done & Close ✓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
