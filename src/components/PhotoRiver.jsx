import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import { photoRiverRows } from '../data/playlists';

export default function PhotoRiver() {
  const { lang } = useLanguage();
  const { openModal } = useUI();

  const handleCardClick = (item) => {
    openModal('lightbox', {
      src: item.src,
      title: lang === 'bn' ? item.title_bn : item.title,
      caption: lang === 'bn' ? (item.desc_bn || item.title_bn) : (item.desc || item.title),
      uploader: lang === 'bn' ? (item.author || 'ঐতিহ্য সংরক্ষণ') : (item.author || 'Heritage Archive')
    });
  };

  const renderTrackItems = (rowOrItems) => {
    const list = Array.isArray(rowOrItems) ? rowOrItems : (rowOrItems?.photos || []);
    if (!list || list.length === 0) return null;
    // Duplicate for seamless infinite loop
    const tri = [...list, ...list, ...list];
    return tri.map((item, idx) => (
      <div 
        key={`${item.id}-${idx}`} 
        className="river-card" 
        role="button"
        tabIndex={0}
        aria-label={lang === 'bn' ? item.title_bn : item.title}
        onClick={() => handleCardClick(item)}
      >
        <img 
          src={item.src} 
          alt={lang === 'bn' ? item.title_bn : item.title} 
          className="river-card-img" 
          loading="lazy" 
          decoding="async" 
        />
        <div className="river-card-overlay">
          <div className="river-card-top">
            <span className="river-category-pill">{item.categoryLabel || (lang === 'bn' ? '🌸 দর্শন' : 'Darshan')}</span>
            <span className="river-zoom-badge" aria-hidden="true">🔍</span>
          </div>
          <div className="river-card-bottom">
            <h4 className="river-card-title">{lang === 'bn' ? item.title_bn : item.title}</h4>
            <span className="river-card-likes">❤️ <span className="like-val">{item.likes || 18}</span> {lang === 'bn' ? 'প্রণাম' : 'Blessings'}</span>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <section className="photo-river-section" id="photo-river-section" aria-label="দৃষ্টিসুখ — উৎসব ও স্মৃতিধারা">
      <div className="photo-river-container">
        
        {/* Photo River Section Header */}
        <div className="photo-river-header">
          <h2 className="river-section-title">
            {lang === 'bn' ? 'দৃষ্টিসুখ — উৎসব ও স্মৃতিধারা (Photo River)' : 'Visual River of Memories (Photo River)'}
          </h2>
          <p className="river-section-subtitle">
            {lang === 'bn' 
              ? 'সাবেকি একচালা প্রতিমার রূপ, দশমীর ধুনুচি আরতি ও দেড় শতকের ঐতিহাসিক মুহূর্তমালা' 
              : 'Heritage idols, rhythmic dhunuchi aarti, and historic archival memories'}
          </p>
        </div>

        {/* 3 Multi-Row Infinite Horizontal Marquee Tracks */}
        <div className="photo-river-marquee-wrapper" id="photo-river-marquee-wrapper">
          {/* Row 1: Scrolling Right-to-Left (Idols & Natmandir) */}
          <div className="marquee-track-row scroll-left" id="river-track-row-1" role="region" aria-label="Row 1: প্রতিমা দর্শন ও নাটমন্দির আচার">
            <div className="marquee-track-content" id="river-track-content-1">
              {renderTrackItems(photoRiverRows[0])}
            </div>
          </div>

          {/* Row 2: Scrolling Left-to-Right (Dhunuchi & Aarti) */}
          <div className="marquee-track-row scroll-right" id="river-track-row-2" role="region" aria-label="Row 2: ধুনুচি নাচ, ১০৮ প্রদীপ ও আরতি">
            <div className="marquee-track-content" id="river-track-content-2">
              {renderTrackItems(photoRiverRows[1])}
            </div>
          </div>

          {/* Row 3: Scrolling Right-to-Left (Heritage Memories & Bisarjan) */}
          <div className="marquee-track-row scroll-left" id="river-track-row-3" role="region" aria-label="Row 3: ঐতিহ্য, সিঁদুর খেলা ও বিসর্জন">
            <div className="marquee-track-content" id="river-track-content-3">
              {renderTrackItems(photoRiverRows[2])}
            </div>
          </div>
        </div>

        {/* Interactive Hover & Click Hint */}
        <div className="photo-river-hint">
          <span className="hint-pulse-dot"></span>
          <span>
            {lang === 'bn' 
              ? 'যেকোনো ছবিতে স্পর্শ করে পূর্ণাঙ্গ রূপ দর্শন করুন • মাউস হোভারে অ্যানিমেশন স্থির হবে' 
              : 'Tap any image to view in full resolution • Hover to pause marquee'}
          </span>
        </div>

      </div>
    </section>
  );
}
