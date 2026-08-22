// Dual-Engine Audio Streaming System: High-Definition YouTube Stream + Native Web Audio Synthesizer
// Guarantees immediate audio playback across all browsers and environments

import { audioEngine } from './soundEffects.js';

class YouTubeAudioPlayer {
  constructor() {
    this.player = null;
    this.isReady = false;
    this.currentTrack = null;
    this.currentPlaylistKey = 'durgaPuja';
    this.currentVideoId = null;
    this.isPlaying = false;
    this.isLiveDhakMode = false;
    this.isAudioBoosted = false;
    this.isTransitioning = false;
    this.hasEndedFired = false;
    this.pendingTrack = null;
    this.progressInterval = null;
    this.listeners = new Set();
    this.volume = 85;
    this.isMuted = false;
    this.isWebAudioActive = false;
  }

  init(containerId = 'yt-hidden-player') {
    return new Promise((resolve) => {
      let container = document.getElementById(containerId);
      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.position = 'fixed';
        container.style.bottom = '8px';
        container.style.left = '8px';
        container.style.width = '200px';
        container.style.height = '120px';
        container.style.zIndex = '1';
        container.style.opacity = '0.01';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
      }

      const onReadyCallback = () => {
        try {
          this.player = new window.YT.Player(containerId, {
            height: '120',
            width: '200',
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              enablejsapi: 1,
              fs: 0,
              iv_load_policy: 3,
              modestbranding: 1,
              playsinline: 1,
              rel: 0
            },
            events: {
              onReady: () => {
                this.isReady = true;
                if (this.player && typeof this.player.setVolume === 'function') {
                  this.player.setVolume(this.getEffectiveVolume());
                }
                if (this.pendingTrack) {
                  const pt = this.pendingTrack;
                  this.pendingTrack = null;
                  this.loadTrack(pt.track, pt.playlistKey, pt.autoplay);
                }
                resolve();
              },
              onStateChange: (event) => {
                this.handleStateChange(event);
              },
              onError: (err) => {
                console.warn('YouTube stream notice:', err.data);
                this.startNativeWebAudio();
              }
            }
          });
        } catch (err) {
          console.warn('YouTube Player notice:', err);
          this.startNativeWebAudio();
          resolve();
        }
      };

      if (window.YT && window.YT.Player) {
        onReadyCallback();
      } else {
        window.onYouTubeIframeAPIReady = onReadyCallback;
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
      }
    });
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(data) {
    this.listeners.forEach((fn) => {
      try {
        fn(data);
      } catch (e) {
        console.error('Audio Player subscriber error:', e);
      }
    });
  }

  handleStateChange(event) {
    if (!window.YT) return;

    if (event.data === window.YT.PlayerState.PLAYING) {
      this.isPlaying = true;
      this.isTransitioning = false;
      this.stopNativeWebAudio();
      this.startProgressTicker();
      this.notify({
        type: 'state',
        isPlaying: true,
        isLiveDhak: this.isLiveDhakMode,
        track: this.currentTrack,
        playlistKey: this.currentPlaylistKey
      });
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      this.isPlaying = false;
      this.stopProgressTicker();
      this.notify({
        type: 'state',
        isPlaying: false,
        isLiveDhak: this.isLiveDhakMode,
        track: this.currentTrack,
        playlistKey: this.currentPlaylistKey
      });
    } else if (event.data === window.YT.PlayerState.ENDED) {
      if (!this.hasEndedFired) {
        this.hasEndedFired = true;
        this.isPlaying = false;
        this.stopProgressTicker();
        this.notify({ type: 'ended', isLiveDhak: false, track: this.currentTrack });
      }
    } else if (event.data === window.YT.PlayerState.BUFFERING) {
      this.notify({ type: 'buffering', track: this.currentTrack });
    }
  }

  startNativeWebAudio() {
    if (this.isWebAudioActive) return;
    this.isWebAudioActive = true;
    try {
      audioEngine.resumeAudioContext();
      audioEngine.startFestivePujaRadio(this.currentTrack?.title_bn || 'দুগ্গা এলো');
    } catch (e) {}
  }

  stopNativeWebAudio() {
    if (!this.isWebAudioActive) return;
    this.isWebAudioActive = false;
    try {
      audioEngine.stopFestivePujaRadio();
    } catch (e) {}
  }

  loadTrack(track, playlistKey = 'durgaPuja', autoplay = true) {
    if (!track) return;

    this.currentTrack = track;
    this.currentPlaylistKey = playlistKey;
    this.isLiveDhakMode = false;
    this.isTransitioning = true;
    this.hasEndedFired = false;
    this.isMuted = false;

    // Start instant native Web Audio so user hears sound IMMEDIATELY with 0ms delay!
    if (autoplay) {
      this.startNativeWebAudio();
    }

    this.notify({
      type: 'trackChange',
      track: this.currentTrack,
      playlistKey: this.currentPlaylistKey,
      isPlaying: autoplay,
      isLiveDhak: false
    });

    if (!this.player || !this.isReady || typeof this.player.loadVideoById !== 'function') {
      this.pendingTrack = { track, playlistKey, autoplay };
      return;
    }

    const targetVideoId = track.videoId || 'xlElO06nQy8';
    const startSeconds = track.start || 0;

    try {
      if (typeof this.player.unMute === 'function') {
        this.player.unMute();
      }
      if (typeof this.player.setVolume === 'function') {
        this.player.setVolume(this.getEffectiveVolume());
      }

      if (this.currentVideoId === targetVideoId) {
        this.player.seekTo(startSeconds, true);
        if (autoplay) {
          this.player.playVideo();
          this.isPlaying = true;
        } else {
          this.player.pauseVideo();
          this.isPlaying = false;
          this.stopNativeWebAudio();
        }
      } else {
        this.currentVideoId = targetVideoId;
        if (autoplay) {
          this.player.loadVideoById({
            videoId: targetVideoId,
            startSeconds: startSeconds
          });
          this.isPlaying = true;
        } else {
          this.player.cueVideoById({
            videoId: targetVideoId,
            startSeconds: startSeconds
          });
          this.isPlaying = false;
          this.stopNativeWebAudio();
        }
      }
    } catch (err) {
      console.warn('YouTube cue notice:', err);
    }
  }

  getEffectiveVolume() {
    if (this.isMuted) return 0;
    return this.volume || 85;
  }

  play() {
    this.isMuted = false;
    this.isPlaying = true;
    this.startNativeWebAudio();

    if (this.player && this.isReady && typeof this.player.playVideo === 'function') {
      try {
        if (typeof this.player.unMute === 'function') this.player.unMute();
        if (typeof this.player.setVolume === 'function') this.player.setVolume(this.getEffectiveVolume());
        this.player.playVideo();
      } catch (e) {}
    } else if (this.currentTrack) {
      this.loadTrack(this.currentTrack, this.currentPlaylistKey, true);
    }

    this.notify({
      type: 'state',
      isPlaying: true,
      isLiveDhak: false,
      track: this.currentTrack
    });
  }

  pause() {
    this.isPlaying = false;
    this.stopNativeWebAudio();

    if (this.player && this.isReady && typeof this.player.pauseVideo === 'function') {
      try {
        this.player.pauseVideo();
      } catch (e) {}
    }

    this.notify({
      type: 'state',
      isPlaying: false,
      isLiveDhak: false,
      track: this.currentTrack
    });
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  seekTo(seconds) {
    if (this.player && this.isReady && typeof this.player.seekTo === 'function') {
      try {
        const trackStart = this.currentTrack?.start || 0;
        const actualTarget = Math.max(0, trackStart + seconds);
        this.player.seekTo(actualTarget, true);
      } catch (e) {}
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(100, val));
    if (this.player && this.isReady && typeof this.player.setVolume === 'function') {
      try {
        this.player.setVolume(this.getEffectiveVolume());
        if (this.isMuted && this.volume > 0) {
          this.player.unMute();
          this.isMuted = false;
        }
      } catch (e) {}
    }
    audioEngine.setMasterOutputLevel((this.volume / 100) * 1.2);
    this.notify({ type: 'volume', volume: this.volume, isMuted: this.isMuted });
  }

  setMute(isMuted) {
    this.isMuted = !!isMuted;
    if (this.player && this.isReady) {
      try {
        if (this.isMuted) {
          if (typeof this.player.mute === 'function') this.player.mute();
        } else {
          if (typeof this.player.unMute === 'function') this.player.unMute();
          if (typeof this.player.setVolume === 'function') this.player.setVolume(this.getEffectiveVolume());
        }
      } catch (e) {}
    }
    if (this.isMuted) {
      this.stopNativeWebAudio();
    }
    this.notify({ type: 'volume', volume: this.volume, isMuted: this.isMuted });
  }

  startProgressTicker() {
    this.stopProgressTicker();
    this.progressInterval = setInterval(() => {
      this.checkTrackBounds();
    }, 250);
  }

  stopProgressTicker() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  checkTrackBounds() {
    if (!this.player || typeof this.player.getCurrentTime !== 'function') return;
    if (this.isTransitioning) return;

    try {
      const rawCurrent = this.player.getCurrentTime() || 0;
      const trackStart = this.currentTrack?.start || 0;
      const trackEnd = (this.currentTrack?.end !== undefined && this.currentTrack?.end !== null)
        ? this.currentTrack.end
        : null;

      const trackDuration = this.currentTrack?.duration ||
        (trackEnd !== null ? Math.max(1, trackEnd - trackStart) : (this.player.getDuration() || 0));

      if (trackEnd !== null && rawCurrent >= (trackEnd - 0.3)) {
        if (!this.hasEndedFired) {
          this.hasEndedFired = true;
          this.notify({ type: 'ended', isLiveDhak: false, track: this.currentTrack });
        }
        return;
      }

      const relativeCurrent = Math.max(0, Math.min(trackDuration, rawCurrent - trackStart));
      const progress = trackDuration > 0 ? (relativeCurrent / trackDuration) * 100 : 0;

      this.notify({
        type: 'timeUpdate',
        currentTime: relativeCurrent,
        duration: trackDuration,
        progress: progress,
        isLiveDhak: false,
        track: this.currentTrack
      });
    } catch (e) {}
  }
}

export const ytAudioPlayer = new YouTubeAudioPlayer();
