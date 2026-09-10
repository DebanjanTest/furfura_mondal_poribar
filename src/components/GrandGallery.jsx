import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';
import { nativePujoData } from '../data/playlists';

export default function GrandGallery() {
  const { lang } = useLanguage();
  const { openModal, showToast } = useUI();
  const [activeCategory, setActiveCategory] = useState('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [communityPhotos, setCommunityPhotos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mondal_bari_community_photos') || '[]');
    } catch (e) {
      return [];
    }
  });
  const [photoLikes, setPhotoLikes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mondal_bari_photo_likes') || '{}');
    } catch (e) {
      return {};
    }
  });

  // Form states
  const [caption, setCaption] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('community');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);

  const nativeGallery = nativePujoData?.gallery || [];
  const allPhotos = [...communityPhotos, ...nativeGallery];

  const categories = [
    { id: 'all', label_bn: 'সমস্ত ছবি', label_en: 'All Photos' },
    { id: 'protima', label_bn: 'প্রতিমা দর্শন', label_en: 'Idol & Shrine' },
    { id: 'aarti', label_bn: 'ধুনুচি ও আরতি', label_en: 'Dhunuchi & Aarti' },
    { id: 'heritage', label_bn: 'ঐতিহ্য ও পরিবার', label_en: 'Heritage & Family' },
    { id: 'sharat', label_bn: 'শরতের আগমনী', label_en: 'Autumn Arrival' },
    { id: 'community', label_bn: 'ভক্তবৃন্দের স্মৃতি', label_en: 'Devotee Memories' },
  ];

  const getCount = (catId) => {
    if (catId === 'all') return allPhotos.length;
    return allPhotos.filter(p => p.category === catId).length;
  };

  const filteredPhotos = activeCategory === 'all' 
    ? allPhotos 
    : allPhotos.filter(p => p.category === activeCategory);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewSrc(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitUpload = (e) => {
    e.preventDefault();
    if (!previewSrc) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে একটি ছবি নির্বাচন করুন।' : 'Please select a photo.');
      return;
    }

    const newPhoto = {
      id: 'comm_' + Date.now(),
      src: previewSrc,
      title: caption || (lang === 'bn' ? 'ভক্তের স্মৃতি' : 'Devotee Memory'),
      desc: (caption || '') + ' — ' + (author || (lang === 'bn' ? 'শ্রদ্ধাবান ভক্ত' : 'Devotee')),
      category: category,
      categoryLabel: lang === 'bn' ? 'ভক্তদের স্মৃতি' : 'Devotee Memory',
      author: author || (lang === 'bn' ? 'শ্রদ্ধাবান ভক্ত' : 'Devotee'),
      likes: 1,
      isCommunity: true
    };

    const nextPhotos = [newPhoto, ...communityPhotos];
    setCommunityPhotos(nextPhotos);
    localStorage.setItem('mondal_bari_community_photos', JSON.stringify(nextPhotos));

    // Reset form
    setCaption('');
    setAuthor('');
    setSelectedFile(null);
    setPreviewSrc(null);
    setIsUploadOpen(false);
    showToast(lang === 'bn' ? 'আপনার তোলা ছবি সফলভাবে যুক্ত হয়েছে!' : 'Photo uploaded successfully!');
  };

  const handleLike = (id, e) => {
    e.stopPropagation();
    setPhotoLikes(prev => {
      const current = prev[id] || 0;
      const next = { ...prev, [id]: current + 1 };
      localStorage.setItem('mondal_bari_photo_likes', JSON.stringify(next));
      return next;
    });
  };

  const handleCardClick = (item) => {
    openModal('lightbox', {
      src: item.src,
      title: item.title,
      caption: item.desc || item.title,
      uploader: item.author || (lang === 'bn' ? 'ফুরফুরা মণ্ডল পরিবার' : 'Furfura Mondal Family')
    });
  };

  return (
    <section className="grand-gallery-section" id="gallery-section" aria-label="ঐতিহ্যের ফটো গ্যালারি ও উৎসব স্মৃতি">
      <div className="gallery-section-container">
        
        {/* Grand Gallery Header */}
        <div className="gallery-section-header">
          <h2 className="gallery-section-title">
            {lang === 'bn' ? 'ঐতিহ্যের ফটো গ্যালারি ও উৎসব স্মৃতি' : 'Heritage Photo Gallery & Memories'}
          </h2>
          <p className="gallery-section-subtitle">
            {lang === 'bn' 
              ? '১৯৯৭ সাল থেকে নিষ্ঠার সাথে উদযাপিত পুজো স্মৃতি, ঠাকুর বরণ, নাটমন্দিরে ধুনুচি আরতি ও পারিবারিক মিলনের দুর্লভ মুহূর্ত।' 
              : 'Treasured memories of Durga Puja since 1997, idol bishorjon, aarti, and family union.'}
          </p>
        </div>

        {/* Category Filter Bar & Add Photos Button */}
        <div className="gallery-filter-bar">
          <div className="gallery-filter-chips" id="gallery-main-category-chips" role="tablist" aria-label="Photo Category Filters">
            {categories.map(cat => (
              <button 
                key={cat.id} 
                type="button" 
                className={`gallery-filter-chip ${activeCategory === cat.id ? 'active' : ''}`} 
                onClick={() => setActiveCategory(cat.id)}
                role="tab" 
                aria-selected={activeCategory === cat.id}
              >
                <span className="chip-label">{lang === 'bn' ? cat.label_bn : cat.label_en}</span>
                <span className="chip-count" id={`count-cat-${cat.id}`}>{getCount(cat.id)}</span>
              </button>
            ))}
          </div>

          {/* Add Memory / Upload Toggle Button */}
          <button 
            type="button" 
            className="btn-toggle-upload-widget" 
            id="btn-toggle-upload" 
            aria-expanded={isUploadOpen} 
            onClick={() => setIsUploadOpen(prev => !prev)}
          >
            <span>{lang === 'bn' ? 'স্মৃতি ও ছবি জমা দিন' : 'Upload Memory & Photo'}</span>
            <span className={`upload-btn-chevron ${isUploadOpen ? 'rotated' : ''}`} id="upload-chevron">
              {isUploadOpen ? '▴' : '▾'}
            </span>
          </button>
        </div>

        {/* Interactive Photo Upload & Add Memories Widget */}
        <div 
          className="photo-upload-card" 
          id="photo-upload-widget" 
          style={{ display: isUploadOpen ? 'block' : 'none' }}
        >
          <div className="upload-card-header">
            <div className="upload-header-left">
              <span className="upload-badge">{lang === 'bn' ? 'ভক্ত ও দর্শনার্থী স্মৃতি আর্কাইভ' : 'Devotee Memory Archive'}</span>
              <h3 className="upload-title">{lang === 'bn' ? 'আপনার তোলা মন্ডল বাড়ির পূজার ছবি বা স্মৃতি যোগ করুন' : 'Add your photos of Mondal Bari Durga Puja'}</h3>
              <p className="upload-desc">
                {lang === 'bn' 
                  ? 'ছবিটি সরাসরি আপনার ব্রাউজারের মেমোরিতে (localStorage) সংরক্ষিত হবে এবং লাইভ ফটো গ্যালারিতে তাৎক্ষণিক দৃশ্যমান হবে.' 
                  : 'Your photo is saved locally in your browser and visible immediately.'}
              </p>
            </div>
            <button 
              type="button" 
              className="upload-card-close" 
              id="btn-close-upload-card" 
              aria-label="Close Upload Form"
              onClick={() => setIsUploadOpen(false)}
            >
              ✕
            </button>
          </div>

          <form className="upload-form-grid" onSubmit={handleSubmitUpload}>
            {/* Drag & Drop / File Picker Area */}
            <div 
              className="upload-dropzone" 
              id="gallery-dropzone"
              onClick={() => document.getElementById('gallery-file-input')?.click()}
              style={{ cursor: 'pointer' }}
            >
              <input 
                type="file" 
                id="gallery-file-input" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
              {!previewSrc ? (
                <div className="dropzone-content" id="dropzone-idle-content">
                  <strong className="dropzone-text">
                    {lang === 'bn' ? 'ছবি এখানে টেনে এনে ছাড়ুন অথবা ক্লিক করুন' : 'Click to select photo or drag here'}
                  </strong>
                  <span className="dropzone-hint">PNG, JPG, WEBP</span>
                  <button type="button" className="btn-browse-files" id="btn-browse-files">
                    {lang === 'bn' ? 'ডিভাইস থেকে ছবি বাছুন' : 'Browse Files'}
                  </button>
                </div>
              ) : (
                <div className="dropzone-previews" id="dropzone-previews" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={previewSrc} alt="Preview" style={{ maxHeight: '180px', borderRadius: '12px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '0.85rem', color: '#ffcf40', marginTop: '0.5rem' }}>{selectedFile?.name}</span>
                </div>
              )}
            </div>

            {/* Metadata Fields */}
            <div className="upload-meta-fields">
              <div className="input-group">
                <label htmlFor="upload-caption-input" className="input-label">
                  {lang === 'bn' ? 'ছবির বর্ণনা বা শিরোনাম (Caption):' : 'Photo Caption:'}
                </label>
                <input 
                  type="text" 
                  id="upload-caption-input" 
                  className="heritage-text-input" 
                  placeholder={lang === 'bn' ? 'যেমন: মহাষ্টমীর অঞ্জলি ও সন্ধিপূজার ১০৮ প্রদীপ' : 'e.g., Mahashtami Anjali & 108 Diyas'} 
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label htmlFor="upload-author-input" className="input-label">
                    {lang === 'bn' ? 'আপনার নাম / পরিবার:' : 'Your Name / Family:'}
                  </label>
                  <input 
                    type="text" 
                    id="upload-author-input" 
                    className="heritage-text-input" 
                    placeholder={lang === 'bn' ? 'যেমন: অনির্বাণ মণ্ডল ও পরিবার' : 'e.g., Anirban Mondal & Family'} 
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="upload-category-select" className="input-label">
                    {lang === 'bn' ? 'ক্যাটাগরি:' : 'Category:'}
                  </label>
                  <select 
                    id="upload-category-select" 
                    className="heritage-select-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="protima">{lang === 'bn' ? 'প্রতিমা দর্শন' : 'Idol & Shrine'}</option>
                    <option value="aarti">{lang === 'bn' ? 'ধুনুচি ও আরতি' : 'Dhunuchi & Aarti'}</option>
                    <option value="heritage">{lang === 'bn' ? 'ঐতিহ্য ও পরিবার' : 'Heritage & Family'}</option>
                    <option value="sharat">{lang === 'bn' ? 'শরতের আগমনী' : 'Autumn Arrival'}</option>
                    <option value="community">{lang === 'bn' ? 'ভক্তদের স্মৃতি' : 'Devotee Memories'}</option>
                  </select>
                </div>
              </div>

              <div className="upload-actions-row">
                <button type="submit" className="btn-upload-submit" id="btn-submit-photo-upload">
                  <span>{lang === 'bn' ? 'গ্যালারিতে যুক্ত করুন' : 'Add to Live Gallery'}</span>
                </button>
                <button 
                  type="button" 
                  className="btn-upload-clear" 
                  id="btn-clear-upload-form"
                  onClick={() => {
                    setCaption('');
                    setAuthor('');
                    setSelectedFile(null);
                    setPreviewSrc(null);
                  }}
                >
                  <span>{lang === 'bn' ? 'মুছে ফেলুন' : 'Clear Form'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Artisan Photo Cards Grid */}
        <div className="main-photo-gallery-grid" id="main-photo-gallery-grid">
          {filteredPhotos.map((photo, idx) => {
            const extraLikes = photoLikes[photo.id] || 0;
            const totalLikes = (photo.likes || 150) + extraLikes;
            return (
              <div 
                key={photo.id || idx} 
                className="gallery-photo-card" 
                onClick={() => handleCardClick(photo)}
                style={{ cursor: 'pointer' }}
              >
                <div className="photo-frame-wrap">
                  <img 
                    className="photo-frame-img"
                    src={photo.src} 
                    alt={photo.title} 
                    loading="lazy" 
                    decoding="async" 
                    onError={(e) => {
                      const cur = e.currentTarget.src;
                      if (cur.includes('/gallery/')) {
                        e.currentTarget.src = cur.replace('/gallery/', '/onnota/');
                      } else if (!cur.includes('/gallery/art_hero_idol.webp')) {
                        e.currentTarget.src = '/gallery/art_hero_idol.webp';
                      }
                    }}
                  />
                  <span className="photo-category-pill">{photo.categoryLabel || photo.category}</span>
                </div>
                <div className="photo-info-wrap">
                  <h4 className="photo-card-title">{photo.title}</h4>
                  <p className="photo-card-desc">{photo.desc}</p>
                  <div className="photo-card-footer">
                    <span className="photo-author">{photo.author || (lang === 'bn' ? 'মণ্ডল পরিবার' : 'Mondal Family')}</span>
                    <button 
                      type="button" 
                      className="photo-like-btn" 
                      onClick={(e) => handleLike(photo.id, e)}
                      title="প্রণাম ও ভালোবাসা জানান"
                    >
                      ❤️ <span>{totalLikes}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Section Footer / Jump To Top */}
        <div className="gallery-section-footer">
          <div className="footer-left">
            <button 
              type="button" 
              className="btn-jump-to-top" 
              id="btn-jump-top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <span className="jump-arrow">↑</span>
              <span>{lang === 'bn' ? 'শীর্ষে যান (কাউন্টডাউন ও রেডিও)' : 'Jump to Top (Countdown & Radio)'}</span>
            </button>
            <button 
              type="button" 
              className="btn-footer-schedule" 
              id="btn-footer-open-schedule"
              onClick={() => openModal('pujoInfo')}
            >
              <span>{lang === 'bn' ? 'সম্পূর্ণ পূজার সূচি ও নির্ঘণ্ট' : 'Full Puja Schedule'}</span>
            </button>
          </div>
          <div className="footer-right">
            <span className="footer-heritage-tag">
              {lang === 'bn' ? 'মন্ডল বাড়ির পুজো ২০২৬ • ফুরফুরা' : 'Mondal Barir Pujo 2026 • Furfura'}
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
