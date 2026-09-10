import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function PonytailScrollspy() {
  const { lang } = useLanguage();
  const [activeSection, setActiveSection] = useState('hero-section');
  const [scrollProgress, setScrollProgress] = useState(0);

  const sections = [
    { id: 'hero-section', label_bn: 'আগমনী ও কাউন্টডাউন', label_en: 'Countdown & Agomoni' },
    { id: 'invitation-section', label_bn: 'সানন্দ আমন্ত্রণলিপি', label_en: 'Formal Invitation' },
    { id: 'photo-river-section', label_bn: 'দৃষ্টিসুখ ও উৎসব বার', label_en: 'Photo River' },
    { id: 'onnota-section', label_bn: 'পাবলিক আপলোড', label_en: 'Public Uploads' },
    { id: 'gallery-section', label_bn: 'ঐতিহ্যের ফটো গ্যালারি', label_en: 'Heritage Gallery' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (scrollY / totalHeight) * 100 : 0;
      setScrollProgress(progress);

      // Detect active section
      for (const sec of [...sections].reverse()) {
        const el = document.getElementById(sec.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.4) {
            setActiveSection(sec.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <aside className="ponytail-scrollspy hide-on-mobile" id="ponytail-scrollspy" aria-label="Website Section Navigator">
      <div className="spy-track-laser" aria-hidden="true">
        <div className="spy-track-active-fill" id="ponytail-spy-progress" style={{ height: `${scrollProgress}%` }}></div>
      </div>
      <nav className="spy-nodes-group" role="navigation" aria-label="Section Links">
        {sections.map((sec, idx) => {
          const isActive = activeSection === sec.id;
          return (
            <button 
              key={sec.id}
              type="button" 
              className={`spy-node ${isActive ? 'active' : ''}`} 
              data-target={sec.id} 
              data-index={idx} 
              title={lang === 'bn' ? sec.label_bn : sec.label_en} 
              aria-label={`Section ${idx + 1}: ${sec.label_en}`} 
              aria-current={isActive}
              onClick={() => scrollTo(sec.id)}
            >
              <span className="spy-node-ring"></span>
              <span className="spy-node-gem"></span>
              <span className="spy-node-label">{lang === 'bn' ? sec.label_bn : sec.label_en}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
