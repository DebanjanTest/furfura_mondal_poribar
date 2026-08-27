// High-Precision YouTube Audio Streaming Engine & Radio Manager
// Dedicated to Durga Puja Agomoni, Mahalaya Broadcast & Classic Festive Playlists

class YouTubeAudioPlayer {
  constructor() {
    this.player = null;
    this.isReady = false;
    this.currentTrack = null;
    this.currentPlaylistKey = 'durgaPuja';
    this.currentVideoId = null;
    this.isPlaying = false;
    this.isTransitioning = false;
    this.hasEndedFired = false;
    this.pendingTrack = null;
    this.progressInterval = null;
    this.listeners = new Set();
    this.volume = 85;
    this.isMuted = false;
    this.initPromise = null;
  }

  init(containerId = 'yt-hidden-player') {
    if (this.isReady && this.player) return Promise.resolve();
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      let container = document.getElementById(containerId);
      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.position = 'fixed';
        container.style.bottom = '0';
        container.style.right = '0';
        container.style.width = '240px';
        container.style.height = '135px';
        container.style.zIndex = '99';
        container.style.opacity = '0.02';
        container.style.pointerEvents = 'none';
        container.style.overflow = 'hidden';
        container.style.transform = 'scale(0.05)';
        container.style.transformOrigin = 'bottom right';
        document.body.appendChild(container);
      }

      const onReadyCallback = () => {
        try {
          const originUrl = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
          this.player = new window.YT.Player(containerId, {
            height: '135',
            width: '240',
            host: 'https://www.youtube-nocookie.com',
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              enablejsapi: 1,
              fs: 0,
              iv_load_policy: 3,
              modestbranding: 1,
              playsinline: 1,
              rel: 0,
              origin: originUrl
            },
            events: {
              onReady: (event) => {
                this.isReady = true;
                try {
                  if (this.player && typeof this.player.unMute === 'function') {
                    this.player.unMute();
                  }
                  if (this.player && typeof this.player.setVolume === 'function') {
                    this.player.setVolume(this.getEffectiveVolume());
                  }
                } catch (_) {}

                if (this.pendingTrack) {
                  const pt = this.pendingTrack;
                  this.pendingTrack = null;
                  this.loadTrack(pt.track, pt.playlistKey, pt.autoplay);
                } else if (this.isPlaying && this.currentTrack) {
                  this.loadTrack(this.currentTrack, this.currentPlaylistKey, true);
                }
                resolve();
              },
              onStateChange: (event) => {
                this.handleStateChange(event);
              },
              onError: (err) => {
                console.warn('YouTube Player notice code:', err?.data);
                this.notify({ type: 'error', data: err?.data, track: this.currentTrack });
              }
            }
          });
        } catch (err) {
          console.warn('YouTube Player init notice:', err);
          resolve();
        }
      };

      if (window.YT && window.YT.Player) {
        onReadyCallback();
      } else {
        const prevOnReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (typeof prevOnReady === 'function') prevOnReady();
          onReadyCallback();
        };
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          tag.async = true;
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
        }
      }
    });

    return this.initPromise;
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
      this.startProgressTicker();
      this.notify({
        type: 'state',
        isPlaying: true,
        track: this.currentTrack,
        playlistKey: this.currentPlaylistKey
      });
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      this.isPlaying = false;
      this.stopProgressTicker();
      this.notify({
        type: 'state',
        isPlaying: false,
        track: this.currentTrack,
        playlistKey: this.currentPlaylistKey
      });
    } else if (event.data === window.YT.PlayerState.ENDED) {
      if (!this.hasEndedFired) {
        this.hasEndedFired = true;
        this.isPlaying = false;
        this.stopProgressTicker();
        this.notify({ type: 'ended', track: this.currentTrack });
      }
    } else if (event.data === window.YT.PlayerState.BUFFERING) {
      this.notify({ type: 'buffering', track: this.currentTrack });
    }
  }

  loadTrack(track, playlistKey = 'durgaPuja', autoplay = true) {
    if (!track) return;

    this.currentTrack = track;
    this.currentPlaylistKey = playlistKey;
    this.isTransitioning = true;
    this.hasEndedFired = false;
    this.isMuted = false;

    this.notify({
      type: 'trackChange',
      track: this.currentTrack,
      playlistKey: this.currentPlaylistKey,
      isPlaying: autoplay
    });

    if (!this.player || !this.isReady || typeof this.player.loadVideoById !== 'function') {
      this.pendingTrack = { track, playlistKey, autoplay };
      this.init();
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
          this.isPlaying = true;
          this.player.playVideo();
        } else {
          this.isPlaying = false;
          this.player.pauseVideo();
        }
      } else {
        this.currentVideoId = targetVideoId;
        if (autoplay) {
          this.isPlaying = true;
          this.player.loadVideoById({
            videoId: targetVideoId,
            startSeconds: startSeconds
          });
        } else {
          this.isPlaying = false;
          this.player.cueVideoById({
            videoId: targetVideoId,
            startSeconds: startSeconds
          });
        }
      }

      if (autoplay) {
        // Immediate and deferred playVideo trigger to guarantee audio start
        try {
          this.player.unMute();
          this.player.playVideo();
        } catch (_) {}
        setTimeout(() => {
          try {
            if (this.isPlaying && this.player && typeof this.player.playVideo === 'function') {
              this.player.unMute();
              this.player.playVideo();
            }
          } catch (_) {}
        }, 180);
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

    if (this.player && this.isReady && typeof this.player.playVideo === 'function') {
      try {
        if (typeof this.player.unMute === 'function') this.player.unMute();
        if (typeof this.player.setVolume === 'function') this.player.setVolume(this.getEffectiveVolume());
        this.player.playVideo();
      } catch (e) {}
    } else {
      this.init();
      if (this.currentTrack) {
        this.loadTrack(this.currentTrack, this.currentPlaylistKey, true);
      }
    }

    this.notify({
      type: 'state',
      isPlaying: true,
      track: this.currentTrack
    });
  }

  pause() {
    this.isPlaying = false;

    if (this.player && this.isReady && typeof this.player.pauseVideo === 'function') {
      try {
        this.player.pauseVideo();
      } catch (e) {}
    }

    this.notify({
      type: 'state',
      isPlaying: false,
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
          this.notify({ type: 'ended', track: this.currentTrack });
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
        track: this.currentTrack
      });
    } catch (e) {}
  }
}

export const ytAudioPlayer = new YouTubeAudioPlayer();
