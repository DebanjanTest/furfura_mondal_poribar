import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ytAudioPlayer } from '../audio/youtubePlayer.js';
import { audioEngine } from '../audio/soundEffects.js';
import { playlists } from '../data/playlists.js';

const AudioStateContext = createContext();

export function AudioProvider({ children }) {
  const [currentPlaylistKey, setCurrentPlaylistKey] = useState('durgaPuja');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(200);
  const [progress, setProgress] = useState(0);

  const playlist = playlists[currentPlaylistKey]?.tracks || [];
  const currentTrack = playlist[currentTrackIndex] || playlist[0] || null;

  useEffect(() => {
    const handleFirstGesture = () => {
      if (typeof audioEngine.resumeAudioContext === 'function') {
        audioEngine.resumeAudioContext();
      }
    };
    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true, passive: true });
    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = ytAudioPlayer.subscribe((event) => {
      if (event.type === 'state') {
        setIsPlaying(event.isPlaying);
      } else if (event.type === 'trackChange') {
        if (event.playlistKey) setCurrentPlaylistKey(event.playlistKey);
      } else if (event.type === 'timeUpdate') {
        setCurrentTime(event.currentTime || 0);
        setDuration(event.duration || 200);
        setProgress(event.progress || 0);
      } else if (event.type === 'ended') {
        handlePlayNext();
      } else if (event.type === 'error') {
        console.warn('Audio stream error event, advancing to next track gracefully...');
        setTimeout(() => handlePlayNext(), 500);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentPlaylistKey, currentTrackIndex]);

  const playTrack = useCallback((track, playlistKey = 'durgaPuja', index = null) => {
    if (typeof audioEngine.resumeAudioContext === 'function') {
      audioEngine.resumeAudioContext();
    }
    ytAudioPlayer.setMute(false);
    ytAudioPlayer.setVolume(85);

    const targetKey = playlistKey || currentPlaylistKey;
    setCurrentPlaylistKey(targetKey);

    const list = playlists[targetKey]?.tracks || [];
    let idx = index;
    if (idx === null || idx === undefined) {
      idx = list.findIndex(t => t.id === track?.id);
      if (idx === -1) idx = 0;
    }
    setCurrentTrackIndex(idx);
    setSoundEnabled(true);
    setIsPlaying(true);

    const targetTrack = track || list[idx] || list[0];
    ytAudioPlayer.loadTrack(targetTrack, targetKey, true);
  }, [currentPlaylistKey]);

  const togglePlay = useCallback(() => {
    if (typeof audioEngine.resumeAudioContext === 'function') {
      audioEngine.resumeAudioContext();
    }
    ytAudioPlayer.setMute(false);
    ytAudioPlayer.setVolume(85);

    if (!isPlaying) {
      setSoundEnabled(true);
      setIsPlaying(true);
      const list = playlists[currentPlaylistKey]?.tracks || [];
      const track = list[currentTrackIndex] || list[0];
      ytAudioPlayer.loadTrack(track, currentPlaylistKey, true);
    } else {
      setIsPlaying(false);
      ytAudioPlayer.pause();
      if (typeof audioEngine.stopFestivePujaRadio === 'function') {
        audioEngine.stopFestivePujaRadio();
      }
    }
  }, [isPlaying, currentPlaylistKey, currentTrackIndex]);

  const handlePlayNext = useCallback(() => {
    const list = playlists[currentPlaylistKey]?.tracks || [];
    if (list.length === 0) return;
    const nextIdx = (currentTrackIndex + 1) % list.length;
    setCurrentTrackIndex(nextIdx);
    const nextTrack = list[nextIdx];
    ytAudioPlayer.loadTrack(nextTrack, currentPlaylistKey, true);
  }, [currentPlaylistKey, currentTrackIndex]);

  const handlePlayPrev = useCallback(() => {
    const list = playlists[currentPlaylistKey]?.tracks || [];
    if (list.length === 0) return;
    const prevIdx = (currentTrackIndex - 1 + list.length) % list.length;
    setCurrentTrackIndex(prevIdx);
    const prevTrack = list[prevIdx];
    ytAudioPlayer.loadTrack(prevTrack, currentPlaylistKey, true);
  }, [currentPlaylistKey, currentTrackIndex]);

  const seekTo = useCallback((seconds) => {
    ytAudioPlayer.seekTo(seconds);
  }, []);

  const soundFX = {
    shankha: (duration = 2.8) => {
      audioEngine.resumeAudioContext();
      audioEngine.playShankha(duration);
    },
    dha: () => {
      audioEngine.resumeAudioContext();
      audioEngine.playDha(1.0);
    },
    dyang: () => {
      audioEngine.resumeAudioContext();
      audioEngine.playDyang(1.0);
    },
    ta: () => {
      audioEngine.resumeAudioContext();
      audioEngine.playTa(1.0);
    },
    kut: () => {
      audioEngine.resumeAudioContext();
      audioEngine.playKut(1.0);
    },
    gurgur: () => {
      audioEngine.resumeAudioContext();
      audioEngine.playGurgur(1.0, 6);
    },
    kansor: () => {
      audioEngine.resumeAudioContext();
      audioEngine.playKansor(1.0, 'CLANG_HIGH');
    },
    diya: () => {
      audioEngine.resumeAudioContext();
      if (typeof audioEngine.playDiyaLight === 'function') {
        audioEngine.playDiyaLight();
      }
    }
  };

  const playShankha = useCallback(() => {
    soundFX.shankha();
  }, []);

  const playDhakBol = useCallback((bolKey) => {
    if (soundFX[bolKey]) {
      soundFX[bolKey]();
    } else {
      soundFX.dha();
    }
  }, []);

  const value = {
    isPlaying,
    soundEnabled,
    setSoundEnabled,
    currentTrack,
    currentPlaylistKey,
    currentTrackIndex,
    currentTime,
    duration,
    progress,
    playTrack,
    togglePlay,
    playNext: handlePlayNext,
    playPrev: handlePlayPrev,
    seekTo,
    soundFX,
    playShankha,
    playDhakBol,
    audioEngine
  };

  return (
    <AudioStateContext.Provider value={value}>
      {children}
    </AudioStateContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioStateContext);
  if (!ctx) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return ctx;
}
