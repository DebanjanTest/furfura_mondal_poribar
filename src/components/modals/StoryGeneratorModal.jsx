import React, { useState, useRef, useEffect } from 'react';
import { useUI } from '../../context/UIContext';
import { useLanguage } from '../../context/LanguageContext';

export default function StoryGeneratorModal() {
  const { activeModal, closeModal, showToast } = useUI();
  const { lang } = useLanguage();
  const canvasRef = useRef(null);

  const [theme, setTheme] = useState('morning');
  const [headline, setHeadline] = useState('pujo-asche');
  const [showCountdown, setShowCountdown] = useState(true);
  const [showSchedule, setShowSchedule] = useState(true);
  const [showHandle, setShowHandle] = useState(true);

  const headlines = [
    { id: 'pujo-asche', text_bn: 'পুজো আসছে — মন্ডল বাড়ির পুজো ২০২৬', text_en: 'Pujo Asche — Mondal Bari Pujo 2026' },
    { id: 'subho-saradiya', text_bn: 'শুভ শারদীয়া — মন্ডল বাড়ির দুর্গাপূজা', text_en: 'Subho Saradiya — Mondal Bari Durga Puja' },
    { id: 'maa-aschen', text_bn: 'মা আসছেন ঘরে — ১৯৯৭ থেকে প্রতিষ্ঠিত ঐতিহ্য', text_en: 'Maa Aschen Ghore — Heritage Since 1997' },
    { id: 'sandhi-puja', text_bn: '১০৮ পদ্ম ও প্রদীপে মহামিলনোৎসব', text_en: '108 Lotuses & Diyas Celebration' },
  ];

  useEffect(() => {
    if (activeModal !== 'story') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 1080;
    const height = 1920;

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    if (theme === 'morning') {
      grad.addColorStop(0, '#1c0709');
      grad.addColorStop(0.4, '#4a151b');
      grad.addColorStop(0.8, '#b45309');
      grad.addColorStop(1, '#ffcf40');
    } else {
      grad.addColorStop(0, '#040102');
      grad.addColorStop(0.4, '#100508');
      grad.addColorStop(0.8, '#1e0c1b');
      grad.addColorStop(1, '#0c1a30');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Border Frame
    ctx.strokeStyle = '#ffcf40';
    ctx.lineWidth = 14;
    ctx.strokeRect(36, 36, width - 72, height - 72);

    ctx.strokeStyle = 'rgba(255, 207, 64, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(54, 54, width - 108, height - 108);

    // Calligraphy Header
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcf40';
    ctx.font = 'bold 72px serif';
    ctx.fillText('🌸 শ্রীশ্রী দুর্গাপূজা ২০২৬ 🌸', width / 2, 240);

    ctx.fillStyle = '#ffffff';
    ctx.font = '38px sans-serif';
    ctx.fillText('ফুরফুরা মণ্ডল পরিবার • ৩০তম বর্ষ', width / 2, 320);

    // Selected Headline
    const selectedObj = headlines.find(h => h.id === headline) || headlines[0];
    ctx.fillStyle = '#ffcf40';
    ctx.font = 'bold 64px serif';
    ctx.fillText(selectedObj.text_bn, width / 2, 700);

    // Details Box
    if (showCountdown) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(140, 880, width - 280, 240);
      ctx.strokeStyle = '#ffcf40';
      ctx.lineWidth = 3;
      ctx.strokeRect(140, 880, width - 280, 240);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText('শুভ মহালয়া ও চণ্ডীপাঠ', width / 2, 970);
      ctx.fillStyle = '#ffcf40';
      ctx.font = 'bold 56px serif';
      ctx.fillText('১০ অক্টোবর ২০২৬', width / 2, 1050);
    }

    if (showSchedule) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '36px sans-serif';
      ctx.fillText('মহাষ্টমী ও সন্ধিপূজা: ১৮ অক্টোবর ২০২৬', width / 2, 1260);
      ctx.fillText('নাটমন্দির প্রাঙ্গণ • ফুরফুরা, হুগলি', width / 2, 1330);
    }

    if (showHandle) {
      ctx.fillStyle = '#ffcf40';
      ctx.font = '36px sans-serif';
      ctx.fillText('Instagram: @furfura_mondal_poribar', width / 2, 1720);
    }
  }, [activeModal, theme, headline, showCountdown, showSchedule, showHandle]);

  if (activeModal !== 'story') return null;

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'mondal-bari-pujo-story.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast(lang === 'bn' ? 'স্টোরি কার্ড ডাউনলোড শুরু হয়েছে!' : 'Story card download started!');
  };

  return (
    <div className="modal-backdrop active" id="story-generator-modal" role="dialog" aria-modal="true" aria-labelledby="story-modal-title">
      <div className="modal-card story-modal-card">
        {/* Mobile Drawer Grab Handle */}
        <div className="drawer-notch hide-on-desktop" aria-hidden="true"></div>

        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-subtitle">INSTAGRAM & WHATSAPP</span>
            <h2 className="modal-title" id="story-modal-title">
              {lang === 'bn' ? 'শারদীয় স্টোরি কার্ড জেনারেটর' : 'STORY & SHARE CARD GENERATOR'}
            </h2>
          </div>
          <button type="button" className="close-btn" id="btn-close-story-gen" aria-label="Close Story Generator" onClick={closeModal}>✕</button>
        </div>

        <div className="story-gen-body">
          {/* Canvas Preview Container (9:16 Aspect Ratio) */}
          <div className="story-canvas-preview-wrapper">
            <canvas ref={canvasRef} id="story-card-canvas" width="1080" height="1920"></canvas>
            <div className="canvas-badge-overlay">9:16 High-Res Story (1080×1920)</div>
          </div>

          {/* Customizer Controls Panel */}
          <div className="story-controls-panel">
            {/* Atmosphere Theme Selector */}
            <div className="control-group">
              <label className="control-label">{lang === 'bn' ? 'আবহ ও রঙের থিম (Atmosphere Theme)' : 'Atmosphere Theme'}</label>
              <div className="story-theme-selector" id="story-theme-selector">
                <button 
                  type="button" 
                  className={`theme-btn ${theme === 'morning' ? 'active' : ''}`} 
                  onClick={() => setTheme('morning')}
                >
                  🌅 {lang === 'bn' ? 'সকাল (Morning)' : 'Morning'}
                </button>
                <button 
                  type="button" 
                  className={`theme-btn ${theme === 'night' ? 'active' : ''}`} 
                  onClick={() => setTheme('night')}
                >
                  🌙 {lang === 'bn' ? 'রাত (Night)' : 'Night'}
                </button>
              </div>
            </div>

            {/* Message Headline Style */}
            <div className="control-group">
              <label className="control-label">{lang === 'bn' ? 'বার্তা ও শিরোনাম (Headline Quote)' : 'Headline Message'}</label>
              <select 
                className="story-select-input" 
                id="story-headline-select"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              >
                {headlines.map(h => (
                  <option key={h.id} value={h.id}>{lang === 'bn' ? h.text_bn : h.text_en}</option>
                ))}
              </select>
            </div>

            {/* Options Toggles */}
            <div className="control-group">
              <label className="control-label">{lang === 'bn' ? 'কার্ডের উপাদান (Card Elements)' : 'Card Elements'}</label>
              <div className="toggle-pills-row">
                <label className="toggle-pill-label">
                  <input type="checkbox" checked={showCountdown} onChange={(e) => setShowCountdown(e.target.checked)} />
                  <span>{lang === 'bn' ? 'কাউন্টডাউন' : 'Countdown'}</span>
                </label>
                <label className="toggle-pill-label">
                  <input type="checkbox" checked={showSchedule} onChange={(e) => setShowSchedule(e.target.checked)} />
                  <span>{lang === 'bn' ? 'নির্ঘণ্ট' : 'Schedule'}</span>
                </label>
                <label className="toggle-pill-label">
                  <input type="checkbox" checked={showHandle} onChange={(e) => setShowHandle(e.target.checked)} />
                  <span>@furfura_mondal_poribar</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="story-actions">
              <button type="button" className="btn-story-download" onClick={handleDownload}>
                <span>{lang === 'bn' ? 'স্টোরি কার্ড ডাউনলোড' : 'Download Story Card'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
