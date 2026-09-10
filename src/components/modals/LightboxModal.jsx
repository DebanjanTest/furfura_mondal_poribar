import React from 'react';
import { useUI } from '../../context/UIContext';
import { useLanguage } from '../../context/LanguageContext';

export default function LightboxModal() {
  const { activeModal, modalData, closeModal, showToast } = useUI();
  const { lang } = useLanguage();

  if (activeModal !== 'lightbox' || !modalData) return null;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: modalData.title || 'Mondal Bari Pujo Photo',
          text: modalData.caption || 'Mondal Bari Durga Puja Heritage Photo',
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast(lang === 'bn' ? 'লিঙ্ক কপি হয়েছে!' : 'Link copied!');
      }
    } catch (e) {
      // User cancelled
    }
  };

  return (
    <div className="gallery-lightbox-modal active" id="gallery-lightbox-modal" role="dialog" aria-modal="true" aria-label="Photo Lightbox">
      <div className="lightbox-content-box">
        {/* Top Control Bar */}
        <div className="lightbox-top-bar">
          <div className="lightbox-info">
            <h3 className="lightbox-title" id="lightbox-photo-title">{modalData.title}</h3>
            <span className="lightbox-caption" id="lightbox-photo-caption">{modalData.caption}</span>
          </div>
          <button type="button" className="lightbox-close-btn" id="btn-close-lightbox" aria-label="Close Lightbox" onClick={closeModal}>✕</button>
        </div>

        {/* Main Stage & Image Container */}
        <div className="lightbox-stage">
          <img src={modalData.src} alt={modalData.title} className="lightbox-main-img" id="lightbox-display-img" />
        </div>

        {/* Bottom Metadata & Action Bar */}
        <div className="lightbox-bottom-bar">
          <div className="lightbox-credit-wrap">
            <span className="lightbox-uploader-label">{lang === 'bn' ? 'সৌজন্যে:' : 'Courtesy:'}</span>
            <span className="lightbox-uploader-name" id="lightbox-photo-author">{modalData.uploader || 'ফুরফুরা মণ্ডল পরিবার'}</span>
          </div>
          <div className="lightbox-actions">
            <a 
              href={modalData.src} 
              download="mondal-bari-photo.jpg" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="lightbox-action-btn" 
              id="btn-lightbox-download"
            >
              <span>{lang === 'bn' ? 'ছবি ডাউনলোড' : 'Download Photo'}</span>
            </a>
            <button 
              type="button" 
              className="lightbox-action-btn" 
              id="btn-lightbox-share" 
              onClick={handleShare}
            >
              <span>{lang === 'bn' ? 'শেয়ার' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
