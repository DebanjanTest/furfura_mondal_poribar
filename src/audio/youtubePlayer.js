// YouTube IFrame API Background Audio Integration
// Supports Radio Tracks, Mahalaya Segments & Authentic Live Dhak Master Playback (8EA8JrDMZbM)

class YouTubeAudioPlayer {
  constructor() {
    this.player = null;
    this.isReady = false;
    this.currentTrack = null;
    this.currentPlaylistKey = 'durgaPuja';
    this.isPlaying = false;
    this.isLiveDhakMode = false;
    this.isLooping = true;
    this.isAudioBoosted = false;
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
      if (window.YT && window.YT.Player) {
        this.createPlayer(containerId, resolve);
        return;
      }

      // Load YouTube Iframe API script
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        this.createPlayer(containerId, resolve);
      };
    });
  }

  createPlayer(containerId, resolve) {
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.position = 'fixed';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '1px';
      container.style.height = '1px';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }

    this.player = new window.YT.Player(containerId, {
      height: '1',
      width: '1',
      playerVars: {
        playsinline: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        rel: 0,
        modestbranding: 1,
        autoplay: 0,
        origin: window.location.origin
      },
      events: {
        onReady: () => {
          this.isReady = true;
          this.player.setVolume(this.getEffectiveVolume());
          resolve();
        },
        onStateChange: (event) => {
          this.handleStateChange(event);
        },
        onError: (err) => {
          console.warn('YouTube Player error code:', err.data);
          this.notify({ type: 'error', data: err.data });
        }
      }
    });
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(data) {
    this.listeners.forEach((fn) => fn(data));
  }

  handleStateChange(event) {
    // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
    if (event.data === window.YT.PlayerState.PLAYING) {
      this.isPlaying = true;
      this.startProgressTicker();
      this.notify({ type: 'state', isPlaying: true, isLiveDhak: this.isLiveDhakMode });
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      this.isPlaying = false;
      this.stopProgressTicker();
      this.notify({ type: 'state', isPlaying: false, isLiveDhak: this.isLiveDhakMode });
    } else if (event.data === window.YT.PlayerState.ENDED) {
      if (this.isLiveDhakMode && this.isLooping && this.currentTrack) {
        // Continuous loop for Live Dhak video mode
        this.seekTo(0);
        this.play();
      } else {
        this.isPlaying = false;
        this.stopProgressTicker();
        this.notify({ type: 'ended', isLiveDhak: this.isLiveDhakMode });
      }
    } else if (event.data === window.YT.PlayerState.BUFFERING) {
      this.notify({ type: 'buffering' });
    }
  }

  loadTrack(track, playlistKey = 'durgaPuja', autoplay = true) {
    this.currentTrack = track;
    this.currentPlaylistKey = playlistKey;
    this.isLiveDhakMode = false;

    if (!this.player || !this.isReady) {
      console.warn('Player not yet ready, will play once loaded');
      return;
    }

    const videoId = track.videoId || 'SFJeglBF5cg';
    const startSeconds = track.start || 0;

    if (this.cueDebounceTimer) clearTimeout(this.cueDebounceTimer);

    this.cueDebounceTimer = setTimeout(() => {
      if (autoplay) {
        this.player.loadVideoById({
          videoId: videoId,
          startSeconds: startSeconds
        });
        this.isPlaying = true;
      } else {
        this.player.cueVideoById({
          videoId: videoId,
          startSeconds: startSeconds
        });
        this.isPlaying = false;
      }

      this.notify({
        type: 'trackChange',
        track: this.currentTrack,
        playlistKey: this.currentPlaylistKey,
        isPlaying: this.isPlaying,
        isLiveDhak: false
      });
    }, 50);
  }

  // Dedicated Authentic Live Dhak Part Cueing & Playback
  playLiveDhakPart(part, loop = true) {
    this.currentTrack = part;
    this.currentPlaylistKey = 'liveDhakMaster';
    this.isLiveDhakMode = true;
    this.isLooping = loop;

    if (!this.player || !this.isReady) {
      console.warn('Player not yet ready for Live Dhak');
      return;
    }

    const videoId = part.videoId || '8EA8JrDMZbM';
    const startSeconds = part.start || 0;

    if (this.cueDebounceTimer) clearTimeout(this.cueDebounceTimer);

    this.cueDebounceTimer = setTimeout(() => {
      this.player.loadVideoById({
        videoId: videoId,
        startSeconds: startSeconds
      });
      this.isPlaying = true;

      this.notify({
        type: 'liveDhakChange',
        part: this.currentTrack,
        isLooping: this.isLooping,
        isPlaying: true
      });
    }, 50);
  }

  setLiveDhakLoop(isLooping) {
    this.isLooping = Boolean(isLooping);
    this.notify({ type: 'loopChange', isLooping: this.isLooping });
  }

  setAudioBooster(settings = {}) {
    this.boostSettings = { ...this.boostSettings, ...settings };
    if (typeof settings.boosted === 'boolean') {
      this.isAudioBoosted = settings.boosted;
    }
    if (this.player && this.isReady && typeof this.player.setVolume === 'function') {
      this.player.setVolume(this.getEffectiveVolume());
    }
    this.notify({
      type: 'boostChange',
      isBoosted: this.isAudioBoosted,
      settings: this.boostSettings
    });
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
      this.player.playVideo();
      this.isPlaying = true;
      this.notify({ type: 'state', isPlaying: true, isLiveDhak: this.isLiveDhakMode });
    }
  }

  pause() {
    if (this.player && this.isReady && typeof this.player.pauseVideo === 'function') {
      this.player.pauseVideo();
      this.isPlaying = false;
      this.notify({ type: 'state', isPlaying: false, isLiveDhak: this.isLiveDhakMode });
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
      const trackStart = this.currentTrack?.start || 0;
      const actualTarget = trackStart + seconds;
      this.player.seekTo(actualTarget, true);
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(100, val));
    if (this.player && this.isReady && typeof this.player.setVolume === 'function') {
      this.player.setVolume(this.getEffectiveVolume());
      if (this.isMuted && this.volume > 0) {
        this.player.unMute();
        this.isMuted = false;
      }
    }
    this.notify({ type: 'volume', volume: this.volume, isMuted: this.isMuted });
  }

  toggleMute() {
    if (this.player && this.isReady) {
      if (this.isMuted) {
        this.player.unMute();
        this.isMuted = false;
      } else {
        this.player.mute();
        this.isMuted = true;
      }
      this.notify({ type: 'volume', volume: this.volume, isMuted: this.isMuted });
    }
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

    try {
      const rawCurrent = this.player.getCurrentTime() || 0;
      const trackStart = this.currentTrack?.start || 0;
      const trackEnd = this.currentTrack?.end || null;
      const trackDuration = this.currentTrack?.duration || (trackEnd ? trackEnd - trackStart : (this.player.getDuration() || 0));

      // Handle Exact Live Dhak or Segment Boundary Reached
      if (trackEnd && rawCurrent >= trackEnd) {
        if (this.isLiveDhakMode && this.isLooping) {
          this.player.seekTo(trackStart, true);
          this.notify({
            type: 'timeUpdate',
            currentTime: 0,
            duration: trackDuration,
            progress: 0,
            isLiveDhak: true,
            part: this.currentTrack
          });
          return;
        } else if (this.isLiveDhakMode && !this.isLooping) {
          this.pause();
          this.notify({ type: 'liveDhakEnded', part: this.currentTrack });
          return;
        } else {
          this.notify({ type: 'ended' });
          return;
        }
      }

      if (rawCurrent < trackStart - 0.2) {
        this.player.seekTo(trackStart, true);
        return;
      }

      const relativeCurrent = Math.max(0, Math.min(trackDuration, rawCurrent - trackStart));

      this.notify({
        type: 'timeUpdate',
        currentTime: relativeCurrent,
        duration: trackDuration,
        progress: trackDuration > 0 ? (relativeCurrent / trackDuration) * 100 : 0,
        isLiveDhak: this.isLiveDhakMode,
        part: this.currentTrack
      });
    } catch (e) {
      // ignore transient errors
    }
  }
}

export const ytAudioPlayer = new YouTubeAudioPlayer();

