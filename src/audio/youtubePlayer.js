// YouTube IFrame API Background Audio Integration & High-Precision Audio Stream Sync Engine
// Supports Agomoni Puja Radio, 6-Segment Mahalaya Master & Continuous Loop Playback

class YouTubeAudioPlayer {
  constructor() {
    this.player = null;
    this.isReady = false;
    this.currentTrack = null;
    this.currentPlaylistKey = 'durgaPuja';
    this.currentVideoId = null;
    this.isPlaying = false;
    this.isLiveDhakMode = false;
    this.isLooping = true;
    this.isAudioBoosted = false;
    this.isTransitioning = false;
    this.hasEndedFired = false;
    this.pendingTrack = null;
    this.boostSettings = {
      bassBoostDb: 6,
      snapBoostDb: 4,
      masterPercent: 120
    };
    this.progressInterval = null;
    this.listeners = new Set();
    this.volume = 85;
    this.isMuted = false;
    this.cueDebounceTimer = null;
  }

  init(containerId = 'yt-hidden-player') {
    return new Promise((resolve) => {
      const onReadyCallback = () => {
        let container = document.getElementById(containerId);
        if (!container) {
          container = document.createElement('div');
          container.id = containerId;
          container.style.position = 'fixed';
          container.style.bottom = '-600px';
          container.style.right = '-600px';
          container.style.width = '240px';
          container.style.height = '180px';
          container.style.zIndex = '-9999';
          container.style.opacity = '0.001';
          container.style.pointerEvents = 'none';
          document.body.appendChild(container);
        }

        try {
          this.player = new window.YT.Player(containerId, {
            height: '180',
            width: '240',
            playerVars: {
              enablejsapi: 1,
              playsinline: 1,
              controls: 0,
              disablekb: 1,
              fs: 0,
              rel: 0,
              modestbranding: 1,
              autoplay: 1,
              origin: window.location.origin
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
                console.warn('YouTube Player notice code:', err.data);
                this.notify({ type: 'error', data: err.data });
              }
            }
          });
        } catch (err) {
          console.warn('Error creating YT.Player instance:', err);
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
      if (this.isLiveDhakMode && this.isLooping && this.currentTrack) {
        this.seekTo(0);
        this.play();
      } else {
        if (!this.hasEndedFired) {
          this.hasEndedFired = true;
          this.isPlaying = false;
          this.stopProgressTicker();
          this.notify({ type: 'ended', isLiveDhak: false, track: this.currentTrack });
        }
      }
    } else if (event.data === window.YT.PlayerState.BUFFERING) {
      this.notify({ type: 'buffering', track: this.currentTrack });
    }
  }

  loadTrack(track, playlistKey = 'durgaPuja', autoplay = true) {
    if (!track) return;

    this.currentTrack = track;
    this.currentPlaylistKey = playlistKey;
    this.isLiveDhakMode = false;
    this.isTransitioning = true;
    this.hasEndedFired = false;

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

    if (this.cueDebounceTimer) clearTimeout(this.cueDebounceTimer);

    this.cueDebounceTimer = setTimeout(() => {
      try {
        if (this.currentVideoId === targetVideoId) {
          this.player.seekTo(startSeconds, true);
          if (autoplay) {
            this.player.playVideo();
            this.isPlaying = true;
          } else {
            this.player.pauseVideo();
            this.isPlaying = false;
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
          }
        }
        if (typeof this.player.setVolume === 'function') {
          this.player.setVolume(this.getEffectiveVolume());
        }
      } catch (err) {
        console.warn('Error cueing video:', err);
      }
    }, 40);
  }

  getEffectiveVolume() {
    if (this.isMuted) return 0;
    let effective = this.volume;
    if (this.isAudioBoosted) {
      effective = Math.min(100, Math.round(this.volume * (this.boostSettings.masterPercent / 100)));
    }
    return effective;
  }

  play() {
    if (this.player && this.isReady && typeof this.player.playVideo === 'function') {
      try {
        this.player.playVideo();
        this.isPlaying = true;
        this.notify({
          type: 'state',
          isPlaying: true,
          isLiveDhak: this.isLiveDhakMode,
          track: this.currentTrack
        });
      } catch (e) {}
    } else if (this.currentTrack) {
      this.loadTrack(this.currentTrack, this.currentPlaylistKey, true);
    }
  }

  pause() {
    if (this.player && this.isReady && typeof this.player.pauseVideo === 'function') {
      try {
        this.player.pauseVideo();
        this.isPlaying = false;
        this.notify({
          type: 'state',
          isPlaying: false,
          isLiveDhak: this.isLiveDhakMode,
          track: this.currentTrack
        });
      } catch (e) {}
    }
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
