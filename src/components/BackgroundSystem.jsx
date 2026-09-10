import React, { useEffect, useRef } from 'react';
import { useUI } from '../context/UIContext';
import Scene3D from './3d/Scene3D';
import { ParticleSystem } from '../effects/particles';

export default function BackgroundSystem() {
  const { effectiveVibe } = useUI();
  const isNight = effectiveVibe === 'sunset' || effectiveVibe === 'night' || effectiveVibe === 'midnight';
  const particleSystemRef = useRef(null);

  // Initialize and run the 2D procedural atmospheric particle engine
  useEffect(() => {
    let ps = null;
    try {
      ps = new ParticleSystem('particle-canvas');
      ps.init();
      ps.setTimeOfDay(isNight ? 'night' : 'morning');
      particleSystemRef.current = ps;
    } catch (err) {
      console.warn('ParticleSystem init error:', err);
    }

    return () => {
      if (ps) {
        ps.destroy();
      }
    };
  }, []);

  // Synchronize particle system theme consistently between day and night modes
  useEffect(() => {
    if (particleSystemRef.current) {
      particleSystemRef.current.setTimeOfDay(isNight ? 'night' : 'morning');
    }
  }, [isNight]);

  return (
    <div className="background-container" id="bg-container">
      {/* Morning Background Layer (Bright Festive Natmandir) */}
      <picture id="bg-layer-morning" className={`bg-picture-layer ${!isNight ? 'active' : ''}`}>
        <source media="(max-width: 768px)" srcSet="/bg-mobile/mondal-bari-hero-mobile.webp" type="image/webp" width="768" height="1366" />
        <source srcSet="/bg/mondal-bari-hero.webp" type="image/webp" width="1920" height="1080" />
        <img 
          id="bg-morning" 
          className={`bg-layer ${!isNight ? 'active' : ''}`} 
          src="/bg/mondal-bari-hero.webp" 
          alt="Mondol Bari Durga Puja Morning Background" 
          fetchPriority="high" 
          decoding="sync" 
          width="1920" 
          height="1080" 
        />
      </picture>

      {/* Night Background Layer (Serene Dimmer Nocturnal Natmandir with no people) */}
      <picture id="bg-layer-night" className={`bg-picture-layer ${isNight ? 'active' : ''}`}>
        <source media="(max-width: 768px)" srcSet="/bg-mobile/night-mobile.webp" type="image/webp" width="768" height="1366" />
        <source srcSet="/bg/night-1920.webp" type="image/webp" width="1920" height="1080" />
        <img 
          id="bg-night" 
          className={`bg-layer ${isNight ? 'active' : ''}`} 
          src="/bg/night-1920.webp" 
          alt="Mondol Bari Durga Puja Night Background" 
          loading="lazy" 
          decoding="async" 
          width="1920" 
          height="1080" 
        />
      </picture>

      {/* Ambient Cinematic Lighting */}
      <div className="bg-vignette"></div>

      {/* 2D Canvas for Authentic Falling Shiuli Flowers, Kash Phool & Golden Dews */}
      <canvas 
        id="particle-canvas" 
        className="particle-canvas"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 4
        }}
      />

      {/* 3D React Three Fiber Canvas with falling Shiuli petals and golden embers */}
      <Scene3D />
    </div>
  );
}
