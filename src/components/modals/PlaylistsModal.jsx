import React, { useState } from 'react';
import { useAudio } from '../../context/AudioContext';
import { useLanguage } from '../../context/LanguageContext';
import { useUI } from '../../context/UIContext';
import { playlists } from '../../data/playlists';

export default function PlaylistsModal() {
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudio();
  const { lang } = useLanguage();
  const { activeModal, closeModal } = useUI();
  const [activeTab, setActiveTab] = useState('durgaPuja');

  if (activeModal !== 'playlists') return null;

  const currentPlaylist = playlists[activeTab] || playlists.durgaPuja;
  const tracks = currentPlaylist?.tracks || [];

  return (
    <div className="modal-backdrop active" id="playlists-modal" role="dialog" aria-modal="true" aria-labelledby="playlists-modal-title">
      <div className="modal-card">
        {/* Mobile Drawer Grab Handle */}
        <div className="drawer-notch hide-on-desktop" aria-hidden="true"></div>

        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-subtitle">MONDAL BARI PUJO</span>
            <h2 className="modal-title" id="playlists-modal-title">
              {lang === 'bn' ? 'শারদ অডিও প্লেলিস্ট' : 'FESTIVE AUDIO PLAYLISTS'}
            </h2>
          </div>
          <button type="button" className="close-btn" id="btn-close-playlists" aria-label="Close Playlists" onClick={closeModal}>✕</button>
        </div>

        {/* Playlist Category Filter Tabs */}
        <div className="modal-tabs" role="tablist" aria-label="Curated Puja Playlists">
          <button 
            type="button" 
            className={`tab-pill ${activeTab === 'durgaPuja' ? 'active' : ''}`} 
            onClick={() => setActiveTab('durgaPuja')}
            role="tab" 
            aria-selected={activeTab === 'durgaPuja'}
          >
            {lang === 'bn' ? 'সেরা আগমনী' : 'Agomoni Classics'}
          </button>
          <button 
            type="button" 
            className={`tab-pill ${activeTab === 'ogMahalaya' ? 'active' : ''}`} 
            onClick={() => setActiveTab('ogMahalaya')}
            role="tab" 
            aria-selected={activeTab === 'ogMahalaya'}
          >
            {lang === 'bn' ? 'মহালয়া ও স্তোত্র' : 'Mahalaya Stotram'}
          </button>
          <button 
            type="button" 
            className={`tab-pill ${activeTab === 'mahalayaSongs' ? 'active' : ''}`} 
            onClick={() => setActiveTab('mahalayaSongs')}
            role="tab" 
            aria-selected={activeTab === 'mahalayaSongs'}
          >
            {lang === 'bn' ? 'চণ্ডীপাঠ ও গান' : 'Chandipath & Songs'}
          </button>
          <button 
            type="button" 
            className={`tab-pill ${activeTab === 'dhakVibes' ? 'active' : ''}`} 
            onClick={() => setActiveTab('dhakVibes')}
            role="tab" 
            aria-selected={activeTab === 'dhakVibes'}
          >
            {lang === 'bn' ? 'ঢাকের বোল' : 'Dhak Rhythms'}
          </button>
        </div>

        <div className="tab-description" id="playlist-tab-desc">
          {lang === 'bn' ? currentPlaylist.description_bn : currentPlaylist.description}
        </div>

        {/* Track List Scrollable */}
        <div className="track-list-scroll" id="track-list-container">
          {tracks.map((track, idx) => {
            const isThisTrack = currentTrack?.id === track.id || currentTrack?.title_en === track.title_en;
            return (
              <div 
                key={track.id || idx} 
                className={`track-list-item ${isThisTrack ? 'active playing' : ''}`}
                onClick={() => {
                  if (isThisTrack) {
                    togglePlay();
                  } else {
                    playTrack(track);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="track-thumb-box">
                  <img src={track.thumb || 'https://img.youtube.com/vi/' + track.videoId + '/mqdefault.jpg'} alt={track.title_en} />
                  <span className="track-play-badge">
                    {isThisTrack && isPlaying ? '❚❚' : '▶'}
                  </span>
                </div>
                <div className="track-info">
                  <div className="track-title">{lang === 'bn' ? track.title_bn : track.title_en}</div>
                  <div className="track-artist">{track.artist}</div>
                </div>
                <div className="track-duration">{track.duration || '3:45'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
