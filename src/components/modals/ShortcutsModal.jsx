import React from 'react';
import { useUI } from '../../context/UIContext';
import { useLanguage } from '../../context/LanguageContext';

export default function ShortcutsModal() {
  const { activeModal, closeModal } = useUI();
  const { lang } = useLanguage();

  if (activeModal !== 'shortcuts') return null;

  const shortcuts = [
    { key: 'Space', desc_bn: 'প্লে / পজ অডিও', desc_en: 'Play / Pause Audio' },
    { key: 'P', desc_bn: 'পূজা রেডিও প্লেলিস্ট', desc_en: 'Puja Radio Playlists' },
    { key: 'D', desc_bn: 'ঢাকের বোল স্টুডিও', desc_en: 'Dhak Drum Studio' },
    { key: 'S', desc_bn: 'শঙ্খধ্বনি আহ্বান', desc_en: 'Sacred Shankha Call' },
    { key: 'I', desc_bn: 'শারদীয় স্টোরি কার্ড', desc_en: 'Festive Story Card' },
    { key: 'G', desc_bn: 'ঐতিহ্যের ফটো গ্যালারি', desc_en: 'Heritage Photo Gallery' },
    { key: 'Esc', desc_bn: 'খোলা উইন্ডো বন্ধ করুন', desc_en: 'Close Active Modal' },
  ];

  return (
    <div className="modal-backdrop active" id="shortcuts-modal" role="dialog" aria-modal="true" aria-label="Keyboard Shortcuts">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-subtitle">KEYBOARD NAVIGATION</span>
            <h2 className="modal-title">{lang === 'bn' ? 'কিবোর্ড শর্টকাট' : 'KEYBOARD SHORTCUTS'}</h2>
          </div>
          <button type="button" className="close-btn" onClick={closeModal}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {shortcuts.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.6rem' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{lang === 'bn' ? s.desc_bn : s.desc_en}</span>
                <kbd style={{ background: 'rgba(255, 207, 64, 0.15)', border: '1px solid #ffcf40', borderRadius: '6px', padding: '4px 10px', color: '#ffcf40', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
