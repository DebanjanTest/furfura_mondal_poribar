import React, { useState } from 'react';
import { useAudio } from '../context/AudioContext';
import { useLanguage } from '../context/LanguageContext';
import { useUI } from '../context/UIContext';

export default function PlayerDock() {
  const { isPlaying, currentTrack, currentTime, duration, togglePlay, playNext, playPrev, seekTo } = useAudio();
  const { lang } = useLanguage();
  const { openModal } = useUI();
  const [minimized, setMinimized] = useState(false);

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleScrubberChange = (e) => {
    const val = parseFloat(e.target.value);
    if (duration > 0) {
      seekTo((val / 100) * duration);
    }
  };

  return (
    <footer className="bottom-system-container" role="contentinfo">
      {/* Desktop Floating Minimal Music Launcher Pill (When Dock is Minimized) */}
      <button 
        type="button" 
        className="floating-music-launcher hide-on-mobile" 
        id="btn-floating-music-launcher" 
        title="রেডিও প্লেয়ার খুলুন (Key P)" 
        aria-label="Open Radio Player"
        style={{ display: minimized ? 'flex' : 'none' }}
        onClick={() => setMinimized(false)}
      >
        <span className="launcher-text" id="floating-pill-title">{lang === 'bn' ? 'পুজো রেডিও' : 'Puja Radio'}</span>
        <span className={`launcher-eq-bars ${isPlaying ? 'playing' : ''}`} id="floating-pill-eq">
          <span></span><span></span><span></span>
        </span>
      </button>

      {/* Desktop Floating Glass Dock (768px+) */}
      <div 
        className={`desktop-dock-wrapper hide-on-mobile ${minimized ? 'minimized' : ''}`} 
        id="desktop-dock-wrapper"
        style={{ display: minimized ? 'none' : 'block' }}
      >
        <div className="player-dock">
          {/* Vinyl Cover Art */}
          <div 
            className="track-art-wrapper" 
            id="player-art-btn" 
            title="Open Curated Radio Playlists"
            onClick={() => openModal('playlists')}
            style={{ cursor: 'pointer' }}
          >
            <img 
              id="player-cover-img" 
              className={`track-art-img ${isPlaying ? 'spinning' : ''}`} 
              src={currentTrack?.thumb || 'https://img.youtube.com/vi/xlElO06nQy8/mqdefault.jpg'} 
              alt="Now Playing Track Artwork" 
              width="56" 
              height="56" 
              loading="lazy" 
              decoding="async" 
            />
          </div>

          {/* Track Metadata & Interactive Seekbar */}
          <div className="track-info-box">
            <div className="track-meta-row">
              <div className="track-title-text" id="player-track-title">
                {currentTrack ? (lang === 'bn' ? currentTrack.title_bn : currentTrack.title_en) : 'দুগ্গা এলো (Dugga Elo)'}
              </div>
              <span className="track-meta-separator" aria-hidden="true">•</span>
              <div className="track-artist-text" id="player-track-artist">
                {currentTrack?.artist || 'Monali Thakur'}
              </div>
            </div>
            <div className="scrubber-row">
              <input 
                type="range" 
                className="scrubber-slider" 
                id="player-scrubber" 
                min="0" 
                max="100" 
                value={progressPercent || 0} 
                onChange={handleScrubberChange}
                aria-label="Music Track Progress" 
              />
            </div>
            <div className="timecode-row">
              <span className="track-time-label" id="player-time-text">
                {`${formatTime(currentTime)} / ${formatTime(duration || 236)}`}
              </span>
            </div>
          </div>

          {/* Playback Transport Controls */}
          <div className="playback-controls">
            <button 
              type="button" 
              className="ctrl-btn" 
              id="btn-prev-track" 
              title="Previous Track" 
              aria-label="Previous Track"
              onClick={playPrev}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            <button 
              type="button" 
              className="ctrl-btn play-main" 
              id="btn-play-pause" 
              title="Play / Pause" 
              aria-label="Play or Pause Track"
              onClick={togglePlay}
            >
              <svg id="icon-play" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ display: isPlaying ? 'none' : 'block' }}>
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg id="icon-pause" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ display: isPlaying ? 'block' : 'none' }}>
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            </button>
            <button 
              type="button" 
              className="ctrl-btn" 
              id="btn-next-track" 
              title="Next Track" 
              aria-label="Next Track"
              onClick={playNext}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          </div>

          {/* Playlist Launcher Pill */}
          <button 
            type="button" 
            className="playlist-launcher-btn" 
            id="btn-open-playlists" 
            title="Open Full Puja Playlists (Key P)"
            onClick={() => openModal('playlists')}
          >
            <span className="launcher-pulse"></span>
            <span id="launcher-pill-text">{lang === 'bn' ? 'পূজা রেডিও' : 'PUJA RADIO'}</span>
            <span className="launcher-icon">⌄</span>
          </button>

          {/* Minimize Player Dock Button */}
          <button 
            type="button" 
            className="dock-minimize-btn" 
            id="btn-minimize-dock" 
            title="প্লেয়ার লুকিয়ে রাখুন (Minimize)" 
            aria-label="Minimize Player Dock"
            onClick={() => setMinimized(true)}
          >
            ✕
          </button>
        </div>
      </div>
    </footer>
  );
}
