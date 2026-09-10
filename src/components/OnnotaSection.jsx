import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import { onnotaCreations } from '../data/playlists';

export default function OnnotaSection() {
  const { lang } = useLanguage();
  const { openModal } = useUI();
  const [activeCategory, setActiveCategory] = useState('all');
  const [likes, setLikes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mondal_bari_onnota_likes') || '{}');
    } catch (e) {
      return {};
    }
  });

  // 5 Canonical Categories requested by user
  const categories = [
    { id: 'all', label_bn: 'সমস্ত সৃষ্টি', label_en: 'All Creations' },
    { id: 'art', label_bn: 'চিত্রশিল্প ও অলঙ্করণ', label_en: 'Fine Art & Painting' },
    { id: 'photography', label_bn: 'উৎসব আলোকচিত্র', label_en: 'Festival Photography' },
    { id: 'crafts', label_bn: 'হস্তশিল্প ও সাবেকি আলপনা', label_en: 'Handicrafts & Alpona' },
    { id: 'literature', label_bn: 'সাহিত্য ও স্মৃতিচারণ', label_en: 'Literature & Memoirs' },
  ];

  const getCount = (catId) => {
    if (catId === 'all') return onnotaCreations.length;
    return onnotaCreations.filter(c => c.category === catId).length;
  };

  const filteredItems = activeCategory === 'all' 
    ? onnotaCreations 
    : onnotaCreations.filter(c => c.category === activeCategory);

  const handleLike = (id, e) => {
    e.stopPropagation();
    setLikes(prev => {
      const current = prev[id] || 0;
      const next = { ...prev, [id]: current + 1 };
      try {
        localStorage.setItem('mondal_bari_onnota_likes', JSON.stringify(next));
      } catch (err) {
        // ignore
      }
      return next;
    });
  };

  const handleCardClick = (item) => {
    openModal('lightbox', {
      src: item.src,
      title: lang === 'bn' ? item.title_bn : item.title,
      caption: lang === 'bn' ? (item.desc_bn || item.desc_en) : (item.desc_en || item.desc_bn),
      uploader: lang === 'bn' ? (item.author || 'ভক্ত ও সুধীবৃন্দ') : (item.authorEnglish || 'Devotee Community')
    });
  };

  const handleShare = (item, e) => {
    e.stopPropagation();
    const title = lang === 'bn' ? item.title_bn : item.title;
    const text = lang === 'bn' ? (item.desc_bn || item.desc_en) : (item.desc_en || item.desc_bn);
    const url = window.location.href;

    if (navigator.share) {
      navigator.share({ title: `${title} | মন্ডল বাড়ির পুজো ২০২৬`, text, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(`${title} - ${url}`);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'art': return '🎨';
      case 'photography': return '📷';
      case 'crafts': return '🪔';
      case 'literature': return '📜';
      default: return '🌸';
    }
  };

  return (
    <section className="onnota-section" id="onnota-section" aria-label="পাবলিক আপলোড ও ক্রিয়েশনস (Public Uploads)">
      <div className="onnota-section-container">
        
        {/* Onnota Section Header */}
        <div className="onnota-section-header">
          <h2 className="onnota-section-title">
            {lang === 'bn' ? 'পাবলিক আপলোড (Public Uploads)' : 'Public Uploads (Others by Onnota)'}
          </h2>
          <p className="onnota-section-subtitle">
            {lang === 'bn' 
              ? 'শারদ সাহিত্যের স্মৃতিচারণ, উৎসব আলোকচিত্র, সাবেকি পিটুলি আলপনা ও ডিজিটাল ক্যানভাস' 
              : 'Festive memoirs, photography, traditional alpona art and digital creations'}
          </p>
        </div>

        {/* Filter Category Chips Bar - 5 Clean Categories with Exact Counts */}
        <div className="onnota-filter-bar">
          <div className="onnota-filter-chips" id="onnota-category-chips" role="tablist" aria-label="Onnota Category Filters">
            {categories.map(cat => (
              <button 
                key={cat.id} 
                type="button" 
                className={`onnota-filter-chip ${activeCategory === cat.id ? 'active' : ''}`} 
                onClick={() => setActiveCategory(cat.id)}
                role="tab" 
                aria-selected={activeCategory === cat.id}
              >
                <span className="chip-label">{lang === 'bn' ? cat.label_bn : cat.label_en}</span>
                <span className="chip-count" id={`onnota-count-${cat.id}`}>{getCount(cat.id)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Community Post Feed Grid */}
        <div className="onnota-cards-grid" id="onnota-cards-grid" role="feed" aria-label="Community Creations Feed">
          {filteredItems.map(item => {
            const extraLikes = likes[item.id] || 0;
            const totalLikes = (item.likes || 120) + extraLikes;
            const isLiked = extraLikes > 0;
            const title = lang === 'bn' ? item.title_bn : item.title;
            const desc = lang === 'bn' ? (item.desc_bn || item.desc_en) : (item.desc_en || item.desc_bn);
            const categoryLabel = lang === 'bn' ? (item.categoryLabel || item.category) : (item.category || item.categoryLabel);
            const author = lang === 'bn' ? (item.author || 'ভক্ত ও সুধীবৃন্দ') : (item.authorEnglish || 'Devotee Community');
            const date = lang === 'bn' ? (item.date || 'শরৎ ২০২৬') : 'Autumn 2026';

            return (
              <article 
                key={item.id} 
                className="onnota-card onnota-post-card" 
                id={`post-${item.id}`}
                tabIndex={0}
              >
                {/* 1. Post Header: Creator Avatar, Name, Date & Category */}
                <header className="onnota-post-header">
                  <div className="onnota-post-author-group">
                    <div className="onnota-post-avatar" aria-hidden="true">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="onnota-post-author-meta">
                      <span className="onnota-post-author-name">{author}</span>
                      <span className="onnota-post-date">{date} • {lang === 'bn' ? 'ফুরফুরা' : 'Furfura'}</span>
                    </div>
                  </div>
                  <span className="onnota-post-category-pill">{categoryLabel}</span>
                </header>

                {/* 2. Post Media / Image Section */}
                <div 
                  className="onnota-post-media"
                  onClick={() => handleCardClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(item); }}
                  title={lang === 'bn' ? 'ক্লিক করে পূর্ণাঙ্গ ছবি দেখুন' : 'Click to expand photo'}
                >
                  <img 
                    className="onnota-post-img" 
                    src={item.src} 
                    alt={title} 
                    loading="eager" 
                    decoding="async"
                    onError={(e) => {
                      const cur = e.currentTarget.src;
                      if (cur.includes('/onnota/')) {
                        e.currentTarget.src = cur.replace('/onnota/', '/gallery/');
                      } else if (!cur.includes('/gallery/art_hero_idol.webp')) {
                        e.currentTarget.src = '/gallery/art_hero_idol.webp';
                      }
                    }}
                  />
                  
                  {/* Subtle Hover Hint to Expand */}
                  <div className="onnota-post-media-overlay">
                    <span className="onnota-post-expand-badge">
                      <span>🔍</span>
                      <span>{lang === 'bn' ? 'পূর্ণাঙ্গ দর্শন' : 'Expand Photo'}</span>
                    </span>
                  </div>

                  {item.tag && <span className="onnota-post-tag-badge">#{item.tag}</span>}
                </div>

                {/* 3. Post Content: Title & Caption */}
                <div className="onnota-post-content">
                  <h3 className="onnota-post-title" onClick={() => handleCardClick(item)}>{title}</h3>
                  <p className="onnota-post-desc">{desc}</p>
                </div>

                {/* 4. Post Action Bar: Like / Pranam, Lightbox & Share */}
                <footer className="onnota-post-footer">
                  <button 
                    type="button" 
                    className={`onnota-post-like-btn ${isLiked ? 'liked' : ''}`} 
                    onClick={(e) => handleLike(item.id, e)}
                    title={lang === 'bn' ? 'প্রণাম ও ভালোবাসা জানান' : 'Give Pranam Blessing'}
                    aria-label="প্রণাম জানান"
                  >
                    <span className="post-heart-icon">{isLiked ? '❤️' : '🤍'}</span>
                    <span className="post-like-count">{totalLikes}</span>
                    <span className="post-like-text">{lang === 'bn' ? 'প্রণাম' : 'Pranam'}</span>
                  </button>

                  <div className="onnota-post-actions-right">
                    <button 
                      type="button" 
                      className="onnota-post-action-btn"
                      onClick={() => handleCardClick(item)}
                      title={lang === 'bn' ? 'পূর্ণাঙ্গ ফটো ভিউয়ার খুলুন' : 'Open Fullscreen Photo'}
                    >
                      <span>🔍</span>
                      <span className="action-btn-label">{lang === 'bn' ? 'ছবি' : 'Photo'}</span>
                    </button>

                    <button 
                      type="button" 
                      className="onnota-post-action-btn"
                      onClick={(e) => handleShare(item, e)}
                      title={lang === 'bn' ? 'পোস্ট শেয়ার করুন' : 'Share Post'}
                    >
                      <span>📤</span>
                      <span className="action-btn-label">{lang === 'bn' ? 'শেয়ার' : 'Share'}</span>
                    </button>
                  </div>
                </footer>
              </article>
            );
          })}
        </div>

        {/* Onnota Section Footer / Navigation Jump Bar */}
        <div className="onnota-section-footer">
          <div className="footer-left">
            <a href="#gallery-section" className="btn-jump-to-top" id="btn-onnota-to-gallery">
              <span className="jump-arrow">↓</span>
              <span>{lang === 'bn' ? 'ঐতিহ্যের ফটো গ্যালারিতে যান' : 'Go to Heritage Photo Gallery'}</span>
            </a>
            <button 
              type="button" 
              className="btn-footer-schedule" 
              id="btn-onnota-open-schedule"
              onClick={() => openModal('pujoInfo')}
            >
              <span>{lang === 'bn' ? 'সম্পূর্ণ পূজার নির্ঘণ্ট ও সূচি' : 'Full Puja Schedule & Timeline'}</span>
            </button>
          </div>
          <div className="footer-right">
            <span className="footer-heritage-tag">
              {lang === 'bn' ? 'পাবলিক সৃষ্টি ও উৎসব স্মৃতি' : 'Public Creations & Memories'}
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
