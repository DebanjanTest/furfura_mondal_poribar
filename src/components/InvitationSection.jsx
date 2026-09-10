import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';

export default function InvitationSection() {
  const { lang } = useLanguage();
  const { openModal, showToast } = useUI();
  const [attended, setAttended] = useState(() => {
    return localStorage.getItem('mondal_bari_rsvp_confirmed') === 'true';
  });

  const handleShare = async () => {
    const shareData = {
      title: 'মন্ডল বাড়ির পুজো ২০২৬ — শ্রীশ্রী দুর্গাপূজার সানন্দ আমন্ত্রণ',
      text: 'ফুরফুরা মণ্ডল পরিবারের ৩০তম বর্ষের ঐতিহ্যবাহী শারদ উৎসব ও শ্রীশ্রী দুর্গাপূজায় আপনার সানন্দ উপস্থিতি ও আশীর্বাদ প্রার্থনা করি।',
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast(lang === 'bn' ? 'আমন্ত্রণ লিঙ্ক কপি হয়েছে!' : 'Invitation link copied!');
      }
    } catch (err) {
      // User cancelled
    }
  };

  const handleAttendance = () => {
    const next = !attended;
    setAttended(next);
    localStorage.setItem('mondal_bari_rsvp_confirmed', next ? 'true' : 'false');
    if (next) {
      showToast(lang === 'bn' ? 'আপনার সশ্রদ্ধ প্রণাম ও শুভেচ্ছা গৃহীত হয়েছে!' : 'Blessings and RSVP confirmed!');
    }
  };

  const openFullImage = () => {
    openModal('lightbox', {
      src: '/invitation/invitation.webp',
      title: lang === 'bn' ? 'শ্রীশ্রী দুর্গাপূজার সানন্দ আমন্ত্রণ — ফুরফুরা মণ্ডল পরিবার' : 'Durga Puja Invitation — Furfura Mondal Family',
      caption: lang === 'bn' ? '১৯৯৭ সাল থেকে অনুষ্ঠিত সাবেকি বনেদি পুজো আমন্ত্রণপত্র' : 'Heritage Durga Puja Invitation Card since 1997',
      uploader: lang === 'bn' ? 'মণ্ডল পরিবার' : 'Mondal Family'
    });
  };

  return (
    <section className="invitation-section" id="invitation-section" aria-label="শ্রীশ্রী দুর্গাপূজার সানন্দ আমন্ত্রণ">
      <div className="invitation-container">
        
        {/* Clean Minimal Header */}
        <div className="invitation-header">
          <h2 className="invitation-title">
            {lang === 'bn' ? 'শ্রীশ্রী দুর্গাপূজার সানন্দ আমন্ত্রণ' : 'Formal Durga Puja Invitation'}
          </h2>
        </div>

        {/* Hero Image Centered Showcase Card */}
        <div className="invitation-showcase-card" id="invitation-letterhead-card">
          
          <div 
            className="invitation-frame" 
            id="invitation-image-viewer" 
            title="সম্পূর্ণ আমন্ত্রণপত্র দেখতে স্পর্শ বা ক্লিক করুন"
            onClick={openFullImage}
            style={{ cursor: 'pointer' }}
          >
            <picture>
              <source srcSet="/invitation/invitation.webp" type="image/webp" />
              <img 
                src="/invitation/invitation.webp" 
                alt="শ্রীশ্রী দুর্গাপূজার সানন্দ আমন্ত্রণ — ফুরফুরা মণ্ডল পরিবার" 
                className="invitation-hero-img" 
                id="invitation-card-img" 
                loading="lazy" 
                decoding="async" 
                width="451" 
                height="637" 
              />
            </picture>
            <div className="invitation-zoom-badge">
              <span>{lang === 'bn' ? 'পূর্ণাঙ্গ রূপ দর্শন করুন' : 'View Full Card'}</span>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="invitation-toolbar">
            <a 
              href="/invitation/invitation.jpg" 
              download="Furfura-Mondol-Poribar-Puja-Invitation.jpg" 
              className="invitation-btn btn-download" 
              id="btn-download-invitation" 
              title="আমন্ত্রণপত্র ডাউনলোড করুন"
            >
              <span>{lang === 'bn' ? 'আমন্ত্রণপত্র ডাউনলোড' : 'Download Card'}</span>
            </a>
            <button 
              type="button" 
              className="invitation-btn btn-share" 
              id="btn-share-invitation" 
              title="সানন্দ আমন্ত্রণ জানান"
              onClick={handleShare}
            >
              <span>{lang === 'bn' ? 'সানন্দ আমন্ত্রণ জানান' : 'Share Invitation'}</span>
            </button>
            <button 
              type="button" 
              className={`invitation-btn btn-rsvp ${attended ? 'active' : ''}`} 
              id="btn-confirm-attendance" 
              title="উপস্থিত থাকার শুভেচ্ছা ও প্রণাম জানান"
              onClick={handleAttendance}
            >
              <span id="attendance-btn-text">
                {attended 
                  ? (lang === 'bn' ? 'প্রণাম ও শুভেচ্ছা গৃহীত ✓' : 'RSVP Confirmed ✓') 
                  : (lang === 'bn' ? 'প্রণাম ও শারদ শুভেচ্ছা' : 'Send Blessings / RSVP')}
              </span>
            </button>
          </div>

        </div>

        {/* Section Footer with Next Section Jump */}
        <div className="invitation-section-footer">
          <a href="#photo-river-section" className="invitation-scroll-next" id="btn-invite-scroll-next" aria-label="ছবি ও স্মৃতিধারা দেখুন">
            <span>{lang === 'bn' ? 'পরবর্তী অধ্যায়: দৃষ্টিসুখ — উৎসব ও স্মৃতিধারা' : 'Next: Visual River of Memories'}</span>
          </a>
        </div>

      </div>
    </section>
  );
}
