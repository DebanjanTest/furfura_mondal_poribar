// Smooth Low-Tone YouTube Background Ambient Audio System
// Plays serene background Agomoni / Dhak ambience in a low, gentle, smooth tone

import { ytAudioPlayer } from './youtubePlayer.js';

// Default background ambient YouTube video (serene Durga Puja Agomoni melody)
// User official link: https://youtu.be/DZ21CSg22nc
export const DEFAULT_AMBIENT_CONFIG = {
  videoId: 'DZ21CSg22nc', // User requested YouTube ambient audio stream
  title: 'মন্ডল বাড়ি শারদ আবহ সঙ্গীত (Mondal Bari Ambient)',
  artist: 'ফুরফুরা মণ্ডল পরিবার আবহ',
  lowVolume: 80, // 18% gentle smooth low tone
  fadeInDurationMs: 2500
};

class BackgroundAmbienceEngine {
  constructor() {
    this.videoId = DEFAULT_AMBIENT_CONFIG.videoId;
    this.targetVolume = DEFAULT_AMBIENT_CONFIG.lowVolume;
    this.isEnabled = true;
    this.isPlaying = false;
    this.fadeInterval = null;
  }

  setAmbientVideo(urlOrId) {
    if (!urlOrId) return;
    let vid = urlOrId.trim();

    // Extract ID from full YouTube URL if provided
    const match = vid.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) {
      vid = match[1];
    }

    this.videoId = vid;
    console.log('Background ambient YouTube stream updated:', this.videoId);

    if (this.isPlaying) {
      this.startAmbientPlayback(true);
    }
  }

  async startAmbientPlayback(forceRestart = false) {
    if (!this.isEnabled) return;

    try {
      if (!ytAudioPlayer.isReady) {
        await ytAudioPlayer.init();
      }

      const ambientTrack = {
        id: 'bg-ambient-01',
        title: DEFAULT_AMBIENT_CONFIG.title,
        title_bn: 'মন্ডল বাড়ি শারদ আবহ সঙ্গীত',
        title_en: 'Mondal Bari Festive Ambient',
        artist: DEFAULT_AMBIENT_CONFIG.artist,
        videoId: this.videoId,
        start: 0,
        end: 9999,
        duration: 9999,
        durationLabel: 'Ambient',
        cover: `https://img.youtube.com/vi/${this.videoId}/hqdefault.jpg`,
        isAmbientBackground: true
      };

      // Set initial volume before starting
      ytAudioPlayer.setVolume(this.targetVolume || 18);
      ytAudioPlayer.loadTrack(ambientTrack, 'durgaPuja', true);
      this.isPlaying = true;

      // Smooth volume fade-in up to lowVolume
      this.smoothFadeIn(this.targetVolume || 18, DEFAULT_AMBIENT_CONFIG.fadeInDurationMs);
    } catch (e) {
      console.warn('Background ambient start deferred:', e);
    }
  }

  smoothFadeIn(targetVol = 80, durationMs = 2500) {
    if (this.fadeInterval) clearInterval(this.fadeInterval);

    let currentVol = 2;
    const steps = 25;
    const stepTime = durationMs / steps;
    const increment = (targetVol - currentVol) / steps;

    this.fadeInterval = setInterval(() => {
      currentVol += increment;
      if (currentVol >= targetVol) {
        currentVol = targetVol;
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }
      ytAudioPlayer.setVolume(Math.round(currentVol));
    }, stepTime);
  }

  stopAmbient() {
    this.isPlaying = false;
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    ytAudioPlayer.pause();
  }

  setVolume(vol) {
    this.targetVolume = Math.max(0, Math.min(100, vol));
    ytAudioPlayer.setVolume(this.targetVolume);
  }
}

export const bgAmbience = new BackgroundAmbienceEngine();

// Expose on window for direct user links & developer console
if (typeof window !== 'undefined') {
  window.bgAmbience = bgAmbience;
  window.setAmbientYouTubeVideo = (urlOrId) => bgAmbience.setAmbientVideo(urlOrId);
}
