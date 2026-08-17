import { playlists, nativePujoData, authenticLiveDhakParts, liveDhakMeta } from './data/playlists.js';
import { ytAudioPlayer } from './audio/youtubePlayer.js';
import { audioEngine, dhakSequencer, TRADITIONAL_BOLS } from './audio/soundEffects.js';
import { ParticleSystem } from './effects/particles.js';
import { getTimeOfDay, getCountdown, toBengaliNumerals } from './utils/timeUtils.js';

// Application State
const state = {
  activeVibe: 'auto', // 'auto' or 'early-morning', 'morning', etc.
  currentVibeTime: 'early-morning',
  currentPlaylistKey: 'durgaPuja',
  currentTrackIndex: 0,
  isAudioPlaying: false,
  onlineCount: 54,
  isDhakLooping: false,
  activeDhakView: 'live', // 'live' or 'synth'
  dhakEngineMode: 'pure', // 'pure' (zero-latency pure studio looper) or 'youtube' (youtube original stream)
  currentLiveDhakIndex: 0,
  isLiveDhakPlaying: false,
  isLiveDhakLooping: true,
  activeDhakBarCount: 1,
  soundBooster: {
    preset: 'bass-heavy',
    bassBoostDb: 6,
    snapBoostDb: 4,
    masterPercent: 120
  },
  activeTab: 'durgaPuja',
  activeGalleryCategory: 'all',
  storyGen: {
    theme: 'early-morning',
    headline: 'pujo-asche',
    showCountdown: true,
    showSchedule: true,
    showHandle: true
  }
};

// Particle System Instance
let particles = null;

document.addEventListener('DOMContentLoaded', () => {
  initAtmosphere();
  initCountdown();
  initOnlineCounter();
  initAudioPlayer();
  initModals();
  initSoundTriggers();
  initPujoInfoAndGallery();
  initStoryGenerator();
  initKeyboardShortcuts();
  initParticles();

  // Initialize YouTube Audio Player
  ytAudioPlayer.init().then(() => {
    console.log('Mondal Barir Pujo Audio Player ready!');
  }).catch((e) => {
    console.warn('YouTube Player initialization deferred:', e);
  });
});

/* ==========================================================================
   1. ATMOSPHERE & TIME-OF-DAY SYSTEM
   ========================================================================== */

function initAtmosphere() {
  updateAtmosphere();

  // Periodic check if auto sync mode is active
  setInterval(() => {
    if (state.activeVibe === 'auto') {
      updateAtmosphere();
    }
  }, 60000);

  // Vibe Dropdown Toggle
  const dropdownBtn = document.getElementById('btn-vibe-dropdown');
  const dropdownMenu = document.getElementById('vibe-menu');

  dropdownBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = dropdownMenu.classList.toggle('show');
    dropdownBtn.setAttribute('aria-expanded', isExpanded);
  });

  document.addEventListener('click', () => {
    dropdownMenu?.classList.remove('show');
    dropdownBtn?.setAttribute('aria-expanded', 'false');
  });

  // Vibe Selection Items
  const vibeItems = document.querySelectorAll('.vibe-item');
  vibeItems.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedVibe = btn.getAttribute('data-vibe');
      state.activeVibe = selectedVibe;
      updateAtmosphere();
      dropdownMenu?.classList.remove('show');
      dropdownBtn?.setAttribute('aria-expanded', 'false');
    });
  });
}

function updateAtmosphere() {
  const effectiveTime = state.activeVibe === 'auto' ? getTimeOfDay() : state.activeVibe;
  state.currentVibeTime = effectiveTime;

  // Background scenic layers
  const allBgs = document.querySelectorAll('.bg-layer');
  allBgs.forEach((bg) => bg.classList.remove('active'));

  const targetBg = document.getElementById(`bg-${effectiveTime}`);
  if (targetBg) {
    targetBg.classList.add('active');
  }

  // Dropdown Label & Icon
  const vibeLabels = {
    'early-morning': { icon: '🌅', label: 'Bhor (Dawn)' },
    'morning': { icon: '☀️', label: 'Sokal (Morning)' },
    'afternoon': { icon: '🌤️', label: 'Dupur (Afternoon)' },
    'evening': { icon: '🌆', label: 'Sandhya (Aarti)' },
    'night': { icon: '🏮', label: 'Raat (Night)' },
    'midnight': { icon: '✨', label: 'Modhyoraat (Midnight)' }
  };

  const currentInfo = vibeLabels[effectiveTime] || vibeLabels['morning'];
  const iconEl = document.getElementById('current-vibe-icon');
  const labelEl = document.getElementById('current-vibe-label');

  if (iconEl) iconEl.textContent = currentInfo.icon;
  if (labelEl) {
    labelEl.textContent = state.activeVibe === 'auto' ? `${currentInfo.label} (Auto)` : currentInfo.label;
  }

  // Active state on dropdown items
  document.querySelectorAll('.vibe-item').forEach((item) => {
    item.classList.toggle('active', item.getAttribute('data-vibe') === state.activeVibe);
  });

  // Update particles color & lighting theme
  if (particles) {
    particles.setTimeOfDay(effectiveTime);
  }
}

/* ==========================================================================
   2. COUNTDOWN & ONLINE LIVE COUNTER
   ========================================================================== */

function initCountdown() {
  function tick() {
    const cd = getCountdown();
    const daysEl = document.getElementById('countdown-days-val');
    const labelEl = document.getElementById('countdown-sub-label');

    if (daysEl) {
      daysEl.textContent = cd.days;
    }
    if (labelEl) {
      labelEl.textContent = `days until Mondal Barir Pujo 2026`;
    }
  }

  tick();
  setInterval(tick, 1000);

  // Click on countdown subtext button opens Mondal Barir Pujo Info / Schedule
  document.getElementById('btn-countdown-details')?.addEventListener('click', () => {
    openModal('pujo-info-modal');
  });
}

function initOnlineCounter() {
  const countText = document.getElementById('online-count-text');
  setInterval(() => {
    // Subtle realistic organic fluctuation (+/- 2)
    const change = Math.floor(Math.random() * 5) - 2;
    state.onlineCount = Math.max(42, Math.min(94, state.onlineCount + change));
    if (countText) {
      countText.textContent = `${state.onlineCount} online`;
    }
  }, 4500);
}

/* ==========================================================================
   3. AUDIO PLAYER & DUAL PLAYLISTS SYSTEM
   ========================================================================== */

function initAudioPlayer() {
  const currentList = playlists[state.currentPlaylistKey].tracks;
  const initialTrack = currentList[0];
  updatePlayerUI(initialTrack);

  // Subscribe to YouTube Player Events
  ytAudioPlayer.subscribe((event) => {
    if (event.type === 'state') {
      if (event.isLiveDhak) {
        state.isLiveDhakPlaying = event.isPlaying;
        updateLiveDhakPlayState(event.isPlaying);
      } else {
        state.isAudioPlaying = event.isPlaying;
        updatePlayPauseButton(event.isPlaying);
        updateArtVinylAnimation(event.isPlaying);
        updateEqualizerAnimation();
      }
    } else if (event.type === 'trackChange') {
      if (!event.isLiveDhak) {
        updatePlayerUI(event.track);
      }
    } else if (event.type === 'liveDhakChange') {
      if (state.dhakEngineMode === 'youtube') {
        state.isLiveDhakPlaying = true;
        updateLiveDhakBanner(event.part);
        updateLiveDhakPlayState(true);
        highlightLivePartCard(state.currentLiveDhakIndex);
      }
    } else if (event.type === 'timeUpdate') {
      if (event.isLiveDhak) {
        if (state.dhakEngineMode === 'youtube') {
          updateLiveDhakScrubber(event.currentTime, event.duration, event.progress);
        }
      } else {
        updateScrubber(event.currentTime, event.duration, event.progress);
      }
    } else if (event.type === 'ended') {
      if (!event.isLiveDhak) {
        playNextTrack();
      }
    } else if (event.type === 'liveDhakEnded') {
      if (state.dhakEngineMode === 'youtube') {
        state.isLiveDhakPlaying = false;
        updateLiveDhakPlayState(false);
      }
    }
  });

  // Desktop Play / Pause Button
  const playPauseBtn = document.getElementById('btn-play-pause');
  playPauseBtn?.addEventListener('click', () => handleTogglePlay());

  // Mobile Play / Pause Button
  const mobilePlayPauseBtn = document.getElementById('mobile-btn-play-pause');
  mobilePlayPauseBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    handleTogglePlay();
  });

  // Desktop Prev & Next
  document.getElementById('btn-next-track')?.addEventListener('click', () => playNextTrack());
  document.getElementById('btn-prev-track')?.addEventListener('click', () => playPrevTrack());

  // Mobile Next
  document.getElementById('mobile-btn-next-track')?.addEventListener('click', (e) => {
    e.stopPropagation();
    playNextTrack();
  });

  // Mobile Media Pill Click -> Opens Playlists Modal
  document.getElementById('mobile-media-pill-btn')?.addEventListener('click', () => {
    openModal('playlists-modal');
  });

  // Scrubber Drag
  const scrubber = document.getElementById('player-scrubber');
  scrubber?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const duration = getCurrentTrack()?.duration || 200;
    const targetSeconds = (val / 100) * duration;
    ytAudioPlayer.seekTo(targetSeconds);
  });

  // Open Playlists Modal buttons
  document.getElementById('btn-open-playlists')?.addEventListener('click', () => {
    openModal('playlists-modal');
  });
  document.getElementById('player-art-btn')?.addEventListener('click', () => {
    openModal('playlists-modal');
  });
  document.getElementById('mobile-nav-radio')?.addEventListener('click', () => {
    openModal('playlists-modal');
  });

  // Render Playlist Tracks inside Modal
  renderPlaylistTracks(state.activeTab);

  // Playlist Category Tabs Switch
  const tabPills = document.querySelectorAll('.modal-tabs .tab-pill');
  tabPills.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabPills.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const pKey = tab.getAttribute('data-playlist');
      state.activeTab = pKey;
      renderPlaylistTracks(pKey);
    });
  });
}

function handleTogglePlay() {
  if (!state.isAudioPlaying) {
    const track = getCurrentTrack();
    ytAudioPlayer.loadTrack(track, state.currentPlaylistKey, true);
  } else {
    ytAudioPlayer.togglePlay();
  }
}

function getCurrentTrack() {
  const currentList = playlists[state.currentPlaylistKey]?.tracks || [];
  return currentList[state.currentTrackIndex] || currentList[0];
}

function updatePlayerUI(track) {
  if (!track) return;

  // Desktop Dock Elements
  const titleEl = document.getElementById('player-track-title');
  const artistEl = document.getElementById('player-track-artist');
  const coverImg = document.getElementById('player-cover-img');
  const timeEl = document.getElementById('player-time-text');
  const launcherText = document.getElementById('launcher-pill-text');

  if (titleEl) titleEl.textContent = track.title;
  if (artistEl) artistEl.textContent = track.artist || 'Agomoni';
  if (coverImg) coverImg.src = track.cover || '/favicon.png';
  if (timeEl) timeEl.textContent = `0:00 / ${track.durationLabel || '3:30'}`;
  if (launcherText) launcherText.textContent = playlists[state.currentPlaylistKey]?.pillLabel || 'PUJA RADIO';

  // Mobile Elements
  const mobTitleEl = document.getElementById('mobile-track-title');
  const mobArtistEl = document.getElementById('mobile-track-artist');
  const mobCoverImg = document.getElementById('mobile-cover-img');

  if (mobTitleEl) mobTitleEl.textContent = track.title;
  if (mobArtistEl) mobArtistEl.textContent = track.artist || 'Agomoni';
  if (mobCoverImg) mobCoverImg.src = track.cover || '/favicon.png';
}

function updatePlayPauseButton(isPlaying) {
  // Desktop
  const iconPlay = document.getElementById('icon-play');
  const iconPause = document.getElementById('icon-pause');
  if (iconPlay && iconPause) {
    iconPlay.style.display = isPlaying ? 'none' : 'block';
    iconPause.style.display = isPlaying ? 'block' : 'none';
  }

  // Mobile
  const mobIconPlay = document.getElementById('mobile-icon-play');
  const mobIconPause = document.getElementById('mobile-icon-pause');
  if (mobIconPlay && mobIconPause) {
    mobIconPlay.style.display = isPlaying ? 'none' : 'block';
    mobIconPause.style.display = isPlaying ? 'block' : 'none';
  }
}

function updateArtVinylAnimation(isPlaying) {
  const coverImg = document.getElementById('player-cover-img');
  const mobCoverImg = document.getElementById('mobile-cover-img');

  if (isPlaying) {
    coverImg?.classList.add('vinyl-spin');
    mobCoverImg?.classList.add('vinyl-spin');
  } else {
    coverImg?.classList.remove('vinyl-spin');
    mobCoverImg?.classList.remove('vinyl-spin');
  }
}

function updateScrubber(currentSec, totalSec, progress) {
  const scrubber = document.getElementById('player-scrubber');
  if (scrubber) scrubber.value = progress || 0;

  const timeLabel = document.getElementById('player-time-text');
  if (timeLabel) {
    const curMin = Math.floor(currentSec / 60);
    const curS = Math.floor(currentSec % 60).toString().padStart(2, '0');
    const totMin = Math.floor(totalSec / 60);
    const totS = Math.floor(totalSec % 60).toString().padStart(2, '0');
    timeLabel.textContent = `${curMin}:${curS} / ${totMin}:${totS}`;
  }
}

function playNextTrack() {
  const trackList = playlists[state.currentPlaylistKey].tracks;
  state.currentTrackIndex = (state.currentTrackIndex + 1) % trackList.length;
  const nextTrack = trackList[state.currentTrackIndex];
  ytAudioPlayer.loadTrack(nextTrack, state.currentPlaylistKey, true);
  renderPlaylistTracks(state.activeTab);
}

function playPrevTrack() {
  const trackList = playlists[state.currentPlaylistKey].tracks;
  state.currentTrackIndex = (state.currentTrackIndex - 1 + trackList.length) % trackList.length;
  const prevTrack = trackList[state.currentTrackIndex];
  ytAudioPlayer.loadTrack(prevTrack, state.currentPlaylistKey, true);
  renderPlaylistTracks(state.activeTab);
}

function renderPlaylistTracks(playlistKey) {
  const container = document.getElementById('track-list-container');
  const descEl = document.getElementById('playlist-tab-desc');
  const pData = playlists[playlistKey];

  if (!pData || !container) return;

  if (descEl) descEl.textContent = pData.description;
  container.innerHTML = '';

  pData.tracks.forEach((track, index) => {
    const isCurrentPlaying = state.currentPlaylistKey === playlistKey && state.currentTrackIndex === index;
    const row = document.createElement('div');
    row.className = `track-row ${isCurrentPlaying ? 'active' : ''}`;
    row.setAttribute('data-track-index', index);

    const numLabel = track.num || (index + 1 < 10 ? `0${index + 1}` : `${index + 1}`);

    row.innerHTML = `
      <span class="track-row-num">
        ${isCurrentPlaying && state.isAudioPlaying ? `
          <div class="eq-bars">
            <div class="eq-bar"></div>
            <div class="eq-bar"></div>
            <div class="eq-bar"></div>
          </div>
        ` : numLabel}
      </span>
      <img class="track-row-thumb" src="${track.cover}" alt="${track.title}" loading="lazy" />
      <div class="track-row-info">
        <div class="track-row-title">${track.title}</div>
        <div class="track-row-artist">${track.artist || 'Traditional'}</div>
      </div>
      <span class="track-row-dur">${track.durationLabel || '3:30'}</span>
    `;

    row.addEventListener('click', () => {
      state.currentPlaylistKey = playlistKey;
      state.currentTrackIndex = index;
      ytAudioPlayer.loadTrack(track, playlistKey, true);
      renderPlaylistTracks(playlistKey);
    });

    container.appendChild(row);
  });
}

function updateEqualizerAnimation() {
  renderPlaylistTracks(state.activeTab);
}

/* ==========================================================================
   4. INTERACTIVE SOUNDBOARD & COMPREHENSIVE DHAK STUDIO
   ========================================================================== */

function initSoundTriggers() {
  // Quick Sound Triggers (Header & Floating Bar)
  const triggerShankha = () => {
    audioEngine.playShankha(2.8);
    showShankhaHud();
  };

  document.getElementById('btn-quick-shankha')?.addEventListener('click', triggerShankha);
  document.getElementById('btn-trig-shankha')?.addEventListener('click', triggerShankha);
  document.getElementById('mobile-nav-shankha')?.addEventListener('click', triggerShankha);

  // Dhak Studio Modal Openers
  const openDhakModal = () => {
    openModal('dhak-modal');
  };

  document.getElementById('btn-quick-dhak')?.addEventListener('click', openDhakModal);
  document.getElementById('btn-trig-dhak')?.addEventListener('click', openDhakModal);
  document.getElementById('mobile-nav-dhak')?.addEventListener('click', openDhakModal);

  // Quick Kashor Trigger
  const triggerKashor = () => {
    audioEngine.playKansor(1.0, 'CLANG_HIGH');
  };
  document.getElementById('btn-trig-kashor')?.addEventListener('click', triggerKashor);

  // Initialize Comprehensive Dhak Bol Studio
  initDhakStudio();
}

function initDhakStudio() {
  // -------------------------------------------------------------
  // A. Audio Engine Source Switcher (Pure Web Audio vs YouTube Stream)
  // -------------------------------------------------------------
  const btnEnginePure = document.getElementById('btn-engine-pure');
  const btnEngineYt = document.getElementById('btn-engine-yt');
  const tabEngineIndicator = document.getElementById('tab-engine-indicator');
  const liveEngineStatusText = document.getElementById('live-engine-status-text');
  const seamlessLoopStatusPill = document.getElementById('seamless-loop-status-pill');

  const switchEngineSource = (targetEngine) => {
    state.dhakEngineMode = targetEngine;

    if (targetEngine === 'pure') {
      btnEnginePure?.classList.add('active');
      btnEnginePure?.setAttribute('aria-checked', 'true');
      btnEngineYt?.classList.remove('active');
      btnEngineYt?.setAttribute('aria-checked', 'false');

      if (tabEngineIndicator) tabEngineIndicator.textContent = '⚡ PURE ENGINE';
      if (liveEngineStatusText) liveEngineStatusText.textContent = 'PURE STUDIO LOOP ENGINE';
      if (seamlessLoopStatusPill) {
        seamlessLoopStatusPill.innerHTML = '<span class="loop-icon-mini">🔁</span><span>সিমলেস লুপ সক্রিয় (Gapless)</span>';
      }

      // If YouTube was playing, pause it and transfer playback to Pure Sequencer
      if (ytAudioPlayer.isLiveDhakMode && ytAudioPlayer.isPlaying) {
        ytAudioPlayer.pause();
        playLivePart(state.currentLiveDhakIndex);
      }
    } else {
      btnEngineYt?.classList.add('active');
      btnEngineYt?.setAttribute('aria-checked', 'true');
      btnEnginePure?.classList.remove('active');
      btnEnginePure?.setAttribute('aria-checked', 'false');

      if (tabEngineIndicator) tabEngineIndicator.textContent = '📻 YT STREAM';
      if (liveEngineStatusText) liveEngineStatusText.textContent = 'YOUTUBE ORIGINAL STREAM (8EA8JrDMZbM)';
      if (seamlessLoopStatusPill) {
        seamlessLoopStatusPill.innerHTML = '<span class="loop-icon-mini">📻</span><span>ইউটিউব ফিল্ড স্ট্রিম লুপ</span>';
      }

      // If Pure Sequencer was playing, stop it and transfer playback to YouTube
      if (dhakSequencer.isPlaying) {
        dhakSequencer.stop();
        playLivePart(state.currentLiveDhakIndex);
      }
    }
  };

  btnEnginePure?.addEventListener('click', () => switchEngineSource('pure'));
  btnEngineYt?.addEventListener('click', () => switchEngineSource('youtube'));

  // -------------------------------------------------------------
  // B. Segmented Top Switcher (Live Master vs Synth Drum Studio)
  // -------------------------------------------------------------
  const liveTabBtn = document.getElementById('tab-btn-live-dhak');
  const synthTabBtn = document.getElementById('tab-btn-synth-dhak');
  const liveViewPanel = document.getElementById('dhak-live-view');
  const synthViewPanel = document.getElementById('dhak-synth-view');

  const switchDhakView = (targetView) => {
    state.activeDhakView = targetView;

    if (targetView === 'live') {
      liveTabBtn?.classList.add('active');
      liveTabBtn?.setAttribute('aria-selected', 'true');
      synthTabBtn?.classList.remove('active');
      synthTabBtn?.setAttribute('aria-selected', 'false');

      if (liveViewPanel) liveViewPanel.style.display = 'flex';
      if (synthViewPanel) synthViewPanel.style.display = 'none';
    } else {
      synthTabBtn?.classList.add('active');
      synthTabBtn?.setAttribute('aria-selected', 'true');
      liveTabBtn?.classList.remove('active');
      liveTabBtn?.setAttribute('aria-selected', 'false');

      if (synthViewPanel) synthViewPanel.style.display = 'flex';
      if (liveViewPanel) liveViewPanel.style.display = 'none';
    }
  };

  liveTabBtn?.addEventListener('click', () => switchDhakView('live'));
  synthTabBtn?.addEventListener('click', () => switchDhakView('synth'));

  // -------------------------------------------------------------
  // C. Render 6 Authentic Live Dhak Part Selector Cards
  // -------------------------------------------------------------
  renderLiveDhakParts();

  // -------------------------------------------------------------
  // D. Live Transport & Continuous Loop Controls
  // -------------------------------------------------------------
  const livePlayBtn = document.getElementById('btn-live-play-pause');
  const livePrevBtn = document.getElementById('btn-live-prev-part');
  const liveNextBtn = document.getElementById('btn-live-next-part');
  const liveLoopChk = document.getElementById('chk-live-dhak-loop');
  const liveScrubber = document.getElementById('dhak-live-scrubber');

  livePlayBtn?.addEventListener('click', () => {
    if (state.isLiveDhakPlaying) {
      if (state.dhakEngineMode === 'pure') {
        dhakSequencer.stop();
      } else {
        ytAudioPlayer.pause();
      }
      state.isLiveDhakPlaying = false;
      updateLiveDhakPlayState(false);
    } else {
      playLivePart(state.currentLiveDhakIndex);
    }
  });

  livePrevBtn?.addEventListener('click', () => {
    const total = authenticLiveDhakParts.length;
    state.currentLiveDhakIndex = (state.currentLiveDhakIndex - 1 + total) % total;
    playLivePart(state.currentLiveDhakIndex);
  });

  liveNextBtn?.addEventListener('click', () => {
    const total = authenticLiveDhakParts.length;
    state.currentLiveDhakIndex = (state.currentLiveDhakIndex + 1) % total;
    playLivePart(state.currentLiveDhakIndex);
  });

  liveLoopChk?.addEventListener('change', (e) => {
    state.isLiveDhakLooping = e.target.checked;
    dhakSequencer.loop = state.isLiveDhakLooping;
    ytAudioPlayer.setLiveDhakLoop(state.isLiveDhakLooping);
  });

  liveScrubber?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const part = authenticLiveDhakParts[state.currentLiveDhakIndex];
    if (state.dhakEngineMode === 'pure') {
      const stepIndex = Math.floor((val / 100) * 16) % 16;
      dhakSequencer.currentStep = stepIndex;
      const curTimeEl = document.getElementById('live-dhak-current-time');
      if (curTimeEl) curTimeEl.textContent = `Step: ${stepIndex + 1}/16`;
    } else if (part) {
      const partDur = part.duration || (part.end - part.start);
      const targetSec = (val / 100) * partDur;
      ytAudioPlayer.seekTo(targetSec);
    }
  });

  // Modal Accompany Triggers (Shankha & Kashor)
  document.getElementById('btn-live-shankha')?.addEventListener('click', () => {
    audioEngine.playShankha(2.8);
    showShankhaHud();
  });

  document.getElementById('btn-live-kashor')?.addEventListener('click', () => {
    audioEngine.playKansor(1.0, 'CLANG_HIGH');
  });

  // -------------------------------------------------------------
  // E. Real-Time Sequencer Event Callbacks
  // -------------------------------------------------------------
  dhakSequencer.onStepCallback = (ev) => {
    // 1. Update Scrubber & Timecode
    if (state.dhakEngineMode === 'pure') {
      const curTimeEl = document.getElementById('live-dhak-current-time');
      const scrubber = document.getElementById('dhak-live-scrubber');
      if (curTimeEl) curTimeEl.textContent = `Step: ${ev.step + 1}/${ev.totalSteps}`;
      if (scrubber) scrubber.value = ((ev.step + 1) / ev.totalSteps) * 100;
    }

    // 2. Update Synth View Grid & Pads
    const stepGrid = document.getElementById('dhak-step-grid');
    const allTiles = stepGrid?.querySelectorAll('.step-tile');
    allTiles?.forEach((t) => t.classList.remove('active-step'));

    const currentTile = stepGrid?.querySelector(`.step-tile[data-step="${ev.step}"]`);
    if (currentTile) {
      currentTile.classList.add('active-step');
    }

    const activeStepLabel = document.getElementById('dhak-active-step-label');
    if (activeStepLabel) {
      activeStepLabel.textContent = `Step: ${ev.step + 1} / ${ev.totalSteps}`;
    }

    // Drum Pad Flashes
    if (ev.stroke === 'DHA') flashPad('pad-dha');
    else if (ev.stroke === 'DYANG') flashPad('pad-dyang');
    else if (ev.stroke === 'TA') flashPad('pad-ta');
    else if (ev.stroke === 'KUT') flashPad('pad-kut');
    else if (ev.stroke === 'GUR_GUR') flashPad('pad-gurgur');

    if (ev.kansor && ev.kansor !== 'NONE') {
      flashPad('pad-kashor');
    }
  };

  dhakSequencer.onBarLoopCallback = (barCount, bol) => {
    state.activeDhakBarCount = barCount;
    const barCounterEl = document.getElementById('loop-bar-counter');
    const pulseRing = document.getElementById('loop-pulse-ring');

    if (barCounterEl) {
      barCounterEl.textContent = `BAR ${barCount}`;
    }

    if (pulseRing) {
      pulseRing.classList.add('pulsing');
      setTimeout(() => pulseRing.classList.remove('pulsing'), 300);
    }
  };

  dhakSequencer.onPartChangeCallback = (newBol) => {
    const partIdx = (newBol.id - 1) % authenticLiveDhakParts.length;
    state.currentLiveDhakIndex = partIdx;
    updateLiveDhakBanner(authenticLiveDhakParts[partIdx]);
    highlightLivePartCard(partIdx);
  };

  dhakSequencer.onBpmChangeCallback = (newBpm) => {
    const bpmSlider = document.getElementById('dhak-bpm-slider');
    const bpmVal = document.getElementById('dhak-bpm-val');
    if (bpmSlider) bpmSlider.value = Math.round(newBpm);
    if (bpmVal) bpmVal.textContent = `${Math.round(newBpm)} BPM`;
  };

  // -------------------------------------------------------------
  // F. Studio Sound Booster & EQ Controls
  // -------------------------------------------------------------
  initSoundBoosterControls();

  // -------------------------------------------------------------
  // G. Interactive Drum Studio & Bol Sequencer Controls (Synth View)
  // -------------------------------------------------------------
  initSynthDrumStudioControls();

  // Set initial Live Dhak Banner
  updateLiveDhakBanner(authenticLiveDhakParts[0]);
}

function renderLiveDhakParts() {
  const grid = document.getElementById('live-dhak-parts-grid');
  if (!grid) return;
  grid.innerHTML = '';

  authenticLiveDhakParts.forEach((part, index) => {
    const isCurrent = state.currentLiveDhakIndex === index;
    const card = document.createElement('div');
    card.className = `live-part-card ${isCurrent ? 'active-part' : ''}`;
    card.setAttribute('data-part-index', index);

    card.innerHTML = `
      <div class="live-part-card-top">
        <span class="live-part-num-badge">পর্ব ${part.bengaliNum || index + 1}</span>
        <div class="live-part-meta-pills">
          <span class="live-part-time-pill">⏱️ ${part.durationLabel || '0:18'}</span>
          <span class="live-part-bpm-pill">⚡ ${part.tempoBpm} BPM</span>
        </div>
      </div>

      <div class="live-part-title-group">
        <h4 class="live-part-bengali-title">${part.title_bn}</h4>
        <span class="live-part-english-title">${part.title_en}</span>
      </div>

      <p class="live-part-desc">${part.bengaliDesc || part.description}</p>
      <div class="live-part-acoustic">🔊 ${part.acousticDetails}</div>

      <div class="live-part-footer">
        <button class="live-part-play-btn" data-index="${index}">
          <span class="part-btn-icon">${isCurrent && state.isLiveDhakPlaying ? '⏹' : '▶'}</span>
          <span class="part-btn-text">${isCurrent && state.isLiveDhakPlaying ? 'চলছে (Playing)' : 'বাজান (Play)'}</span>
        </button>

        <div class="live-card-eq-bars ${isCurrent && state.isLiveDhakPlaying ? 'playing' : ''}">
          <div class="live-card-eq-bar"></div>
          <div class="live-card-eq-bar"></div>
          <div class="live-card-eq-bar"></div>
        </div>
      </div>
    `;

    // Click handler for card
    card.addEventListener('click', (e) => {
      if (e.target.closest('.live-part-play-btn')) return;
      playLivePart(index);
    });

    // Click handler for play button
    const playBtn = card.querySelector('.live-part-play-btn');
    playBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isCurrent && state.isLiveDhakPlaying) {
        if (state.dhakEngineMode === 'pure') {
          dhakSequencer.stop();
        } else {
          ytAudioPlayer.pause();
        }
        state.isLiveDhakPlaying = false;
        updateLiveDhakPlayState(false);
      } else {
        playLivePart(index);
      }
    });

    grid.appendChild(card);
  });
}

function playLivePart(index) {
  const part = authenticLiveDhakParts[index];
  if (!part) return;

  state.currentLiveDhakIndex = index;
  state.isLiveDhakPlaying = true;

  if (state.dhakEngineMode === 'pure') {
    // Stop YouTube video stream if running
    if (ytAudioPlayer.isLiveDhakMode && ytAudioPlayer.isPlaying) {
      ytAudioPlayer.pause();
    }

    const bolId = index + 1;
    dhakSequencer.loop = state.isLiveDhakLooping;

    if (dhakSequencer.isPlaying) {
      // Seamless Musical Quantized Part Switching at next bar boundary!
      dhakSequencer.setBol(bolId, true);
    } else {
      dhakSequencer.setBol(bolId, false);
      dhakSequencer.start();
    }

    // Sync synth view dropdown
    const selectEl = document.getElementById('dhak-bol-select');
    if (selectEl) selectEl.value = String(bolId);
  } else {
    // Stop pure sequencer if running
    if (dhakSequencer.isPlaying) {
      dhakSequencer.stop();
      state.isDhakLooping = false;
    }

    // Play Live Dhak via YouTube player
    ytAudioPlayer.playLiveDhakPart(part, state.isLiveDhakLooping);
  }

  updateLiveDhakBanner(part);
  updateLiveDhakPlayState(true);
  highlightLivePartCard(index);
}

function updateLiveDhakBanner(part) {
  if (!part) return;
  const titleEl = document.getElementById('live-dhak-banner-title');
  const subEl = document.getElementById('live-dhak-banner-subtitle');
  const badgeEl = document.getElementById('live-dhak-segment-badge');
  const totalEl = document.getElementById('live-dhak-total-time');

  if (titleEl) titleEl.textContent = `${part.bengaliNum || part.partNumber}. ${part.title_bn}`;
  if (subEl) subEl.textContent = `${part.subtitle_bn} • ${part.title_en}`;
  if (badgeEl) badgeEl.textContent = `পর্ব ${part.num || '০১'}/০৬ • ${part.tempoBpm} BPM • ${part.styleLabel}`;
  if (totalEl) totalEl.textContent = `${part.durationLabel || '0:18'} Loop`;
}

function updateLiveDhakPlayState(isPlaying) {
  state.isLiveDhakPlaying = isPlaying;

  const playBtn = document.getElementById('btn-live-play-pause');
  const playIcon = document.getElementById('live-play-icon');
  const playLabel = document.getElementById('live-play-label');
  const masterEq = document.getElementById('live-dhak-master-eq');

  if (isPlaying) {
    playBtn?.classList.add('is-playing');
    if (playIcon) playIcon.textContent = '⏸';
    if (playLabel) playLabel.textContent = 'থামান (Pause)';
    masterEq?.classList.add('playing');
  } else {
    playBtn?.classList.remove('is-playing');
    if (playIcon) playIcon.textContent = '▶';
    if (playLabel) playLabel.textContent = 'লুপ বাজান (Play Loop)';
    masterEq?.classList.remove('playing');
  }

  highlightLivePartCard(state.currentLiveDhakIndex);
}

function highlightLivePartCard(activeIndex) {
  const cards = document.querySelectorAll('.live-part-card');
  cards.forEach((card, idx) => {
    const isCurrent = idx === activeIndex;
    card.classList.toggle('active-part', isCurrent);

    const btnIcon = card.querySelector('.part-btn-icon');
    const btnText = card.querySelector('.part-btn-text');
    const eqBars = card.querySelector('.live-card-eq-bars');

    if (isCurrent && state.isLiveDhakPlaying) {
      if (btnIcon) btnIcon.textContent = '⏸';
      if (btnText) btnText.textContent = 'চলছে (Playing)';
      eqBars?.classList.add('playing');
    } else {
      if (btnIcon) btnIcon.textContent = '▶';
      if (btnText) btnText.textContent = 'বাজান (Play)';
      eqBars?.classList.remove('playing');
    }
  });
}

function updateLiveDhakScrubber(currentSec, totalSec, progress) {
  const scrubber = document.getElementById('dhak-live-scrubber');
  if (scrubber) scrubber.value = progress || 0;

  const curTimeEl = document.getElementById('live-dhak-current-time');
  if (curTimeEl) {
    const curMin = Math.floor(currentSec / 60);
    const curS = Math.floor(currentSec % 60).toString().padStart(2, '0');
    curTimeEl.textContent = `${curMin}:${curS}`;
  }
}

function initSoundBoosterControls() {
  const bassSlider = document.getElementById('booster-bass-slider');
  const bassVal = document.getElementById('booster-bass-val');
  const snapSlider = document.getElementById('booster-snap-slider');
  const snapVal = document.getElementById('booster-snap-val');
  const masterSlider = document.getElementById('booster-master-slider');
  const masterVal = document.getElementById('booster-master-val');
  const presetBtns = document.querySelectorAll('.booster-preset-btn');

  const applyBoosterSettings = (settings) => {
    state.soundBooster = { ...state.soundBooster, ...settings };

    // Update Web Audio engine filters for drum pads / physical models
    audioEngine.setBassBoost(state.soundBooster.bassBoostDb);
    audioEngine.setSnapBoost(state.soundBooster.snapBoostDb);
    audioEngine.setMasterOutputLevel(state.soundBooster.masterPercent / 100);

    // Update YouTube Audio booster volume multiplier
    ytAudioPlayer.setAudioBooster({
      boosted: true,
      bassBoostDb: state.soundBooster.bassBoostDb,
      snapBoostDb: state.soundBooster.snapBoostDb,
      masterPercent: state.soundBooster.masterPercent
    });

    // Update sliders and text labels
    if (bassSlider) bassSlider.value = state.soundBooster.bassBoostDb;
    if (bassVal) bassVal.textContent = `+${state.soundBooster.bassBoostDb} dB`;

    if (snapSlider) snapSlider.value = state.soundBooster.snapBoostDb;
    if (snapVal) snapVal.textContent = `+${state.soundBooster.snapBoostDb} dB`;

    if (masterSlider) masterSlider.value = state.soundBooster.masterPercent;
    if (masterVal) masterVal.textContent = `${state.soundBooster.masterPercent}%`;
  };

  // Preset Handlers
  const presetsMap = {
    'flat': { bassBoostDb: 0, snapBoostDb: 0, masterPercent: 100 },
    'bass-heavy': { bassBoostDb: 6, snapBoostDb: 4, masterPercent: 120 },
    'crisp-snap': { bassBoostDb: 3, snapBoostDb: 6, masterPercent: 120 },
    'festival-loud': { bassBoostDb: 8, snapBoostDb: 6, masterPercent: 150 }
  };

  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      presetBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const presetKey = btn.getAttribute('data-preset');
      const targetSettings = presetsMap[presetKey] || presetsMap['bass-heavy'];
      applyBoosterSettings(targetSettings);
    });
  });

  // Slider Inputs
  bassSlider?.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    applyBoosterSettings({ bassBoostDb: val });
  });

  snapSlider?.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    applyBoosterSettings({ snapBoostDb: val });
  });

  masterSlider?.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    applyBoosterSettings({ masterPercent: val });
  });

  // Initial application of default preset (Bass Boost +6dB, Crisp Stick +4dB, Master 120%)
  applyBoosterSettings({
    bassBoostDb: 6,
    snapBoostDb: 4,
    masterPercent: 120
  });
}

function initSynthDrumStudioControls() {
  const selectEl = document.getElementById('dhak-bol-select');
  const taalBadge = document.getElementById('dhak-badge-taal');
  const timeBadge = document.getElementById('dhak-badge-time');
  const styleBadge = document.getElementById('dhak-badge-style');
  const vocalPhrase = document.getElementById('dhak-vocal-phrase');
  const romanPhrase = document.getElementById('dhak-roman-phrase');
  const descText = document.getElementById('dhak-desc-text');
  const bpmSlider = document.getElementById('dhak-bpm-slider');
  const bpmVal = document.getElementById('dhak-bpm-val');
  const stepGrid = document.getElementById('dhak-step-grid');
  const activeStepLabel = document.getElementById('dhak-active-step-label');
  const playBtn = document.getElementById('btn-loop-dhak-rhythm');
  const playIcon = document.getElementById('dhak-play-icon');
  const playText = document.getElementById('dhak-play-text');
  const volSlider = document.getElementById('dhak-vol-slider');
  const volVal = document.getElementById('dhak-vol-val');
  const accelerandoChk = document.getElementById('chk-dhak-accelerando');
  const tapTempoBtn = document.getElementById('btn-tap-tempo');
  const styleButtons = document.querySelectorAll('.dhak-mode-btn');

  // Stroke Icons Map
  const strokeIcons = {
    'DHA': '🥁',
    'DYANG': '🥢',
    'TA': '🥢',
    'KUT': '🤏',
    'GUR_GUR': '⚡',
    'NONE': '—'
  };

  const bengNumbers = ['১','২','৩','৪','৫','৬','৭','৮','৯','১০','১১','১২','১৩','১৪','১৫','১৬'];

  const flashPad = (padId) => {
    const el = document.getElementById(padId);
    if (el) {
      el.classList.add('hit');
      setTimeout(() => el.classList.remove('hit'), 120);
    }
  };

  const triggerPad = (padId, soundFn) => {
    flashPad(padId);
    soundFn();
  };

  // Render 16-step visualizer grid
  const renderStepGrid = (bol) => {
    if (!stepGrid || !bol) return;
    stepGrid.innerHTML = '';

    bol.stepSequence.forEach((stepItem) => {
      const tile = document.createElement('div');
      tile.className = `step-tile ${stepItem.stroke !== 'NONE' ? 'has-stroke' : ''} ${stepItem.accent ? 'accent-stroke' : ''}`;
      tile.setAttribute('data-step', stepItem.step);

      tile.innerHTML = `
        <span class="step-idx">${bengNumbers[stepItem.step] || stepItem.step + 1}</span>
        <span class="step-stroke-icon">${strokeIcons[stepItem.stroke] || '🥁'}</span>
        <span class="step-phonetic">${stepItem.phonetic || '-'}</span>
        ${stepItem.kansor && stepItem.kansor !== 'NONE' ? '<span class="step-kansor-dot" title="Kanshor"></span>' : ''}
      `;

      tile.addEventListener('click', () => {
        if (stepItem.stroke === 'DHA') audioEngine.playDha(stepItem.velocity || 1.0);
        else if (stepItem.stroke === 'DYANG') audioEngine.playDyang(stepItem.velocity || 1.0);
        else if (stepItem.stroke === 'TA') audioEngine.playTa(stepItem.velocity || 1.0);
        else if (stepItem.stroke === 'KUT') audioEngine.playKut(stepItem.velocity || 1.0);
        else if (stepItem.stroke === 'GUR_GUR') audioEngine.playGurgur(stepItem.velocity || 1.0, 4);
        if (stepItem.kansor && stepItem.kansor !== 'NONE') audioEngine.playKansor(0.8, stepItem.kansor);
        tile.classList.add('active-step');
        setTimeout(() => tile.classList.remove('active-step'), 150);
      });

      stepGrid.appendChild(tile);
    });
  };

  const updateBolUI = (bol) => {
    if (!bol) return;
    if (taalBadge) taalBadge.textContent = bol.taal || 'Traditional';
    if (timeBadge) timeBadge.textContent = `${bol.timeSignature || '4/4'} • ${bol.barLengthSteps || 16} মাত্রা`;
    if (styleBadge) styleBadge.textContent = bol.styleLabel || bol.style;
    if (vocalPhrase) vocalPhrase.textContent = bol.vocalPhoneticBol;
    if (romanPhrase) romanPhrase.textContent = bol.romanizedBol;
    if (descText) descText.textContent = bol.description;
    if (bpmSlider) bpmSlider.value = bol.tempoBpm;
    if (bpmVal) bpmVal.textContent = `${bol.tempoBpm} BPM`;

    if (bol.style) {
      styleButtons.forEach((b) => {
        const isMatch = b.getAttribute('data-mode') === bol.style;
        b.classList.toggle('active', isMatch);
        b.setAttribute('aria-checked', isMatch ? 'true' : 'false');
      });
    }

    renderStepGrid(bol);
  };

  // Style buttons
  styleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      styleButtons.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      const mode = btn.getAttribute('data-mode');
      dhakSequencer.setStyleMode(mode);
    });
  });

  // Bol Select Dropdown
  selectEl?.addEventListener('change', (e) => {
    const bolId = Number(e.target.value);
    dhakSequencer.setBol(bolId);
    updateBolUI(dhakSequencer.currentBol);
  });

  // Sequencer Step Callback
  dhakSequencer.onStepCallback = (ev) => {
    const allTiles = stepGrid?.querySelectorAll('.step-tile');
    allTiles?.forEach((t) => t.classList.remove('active-step'));

    const currentTile = stepGrid?.querySelector(`.step-tile[data-step="${ev.step}"]`);
    if (currentTile) {
      currentTile.classList.add('active-step');
    }

    if (activeStepLabel) {
      activeStepLabel.textContent = `Step: ${ev.step + 1} / ${ev.totalSteps}`;
    }

    if (ev.stroke === 'DHA') flashPad('pad-dha');
    else if (ev.stroke === 'DYANG') flashPad('pad-dyang');
    else if (ev.stroke === 'TA') flashPad('pad-ta');
    else if (ev.stroke === 'KUT') flashPad('pad-kut');
    else if (ev.stroke === 'GUR_GUR') flashPad('pad-gurgur');

    if (ev.kansor && ev.kansor !== 'NONE') {
      flashPad('pad-kashor');
    }
  };

  // Sequencer BPM Change
  dhakSequencer.onBpmChangeCallback = (newBpm) => {
    if (bpmSlider) bpmSlider.value = Math.round(newBpm);
    if (bpmVal) bpmVal.textContent = `${Math.round(newBpm)} BPM`;
  };

  // 6 Physical Drum Pads Triggers
  document.getElementById('pad-dha')?.addEventListener('click', () => triggerPad('pad-dha', () => audioEngine.playDha(1.0)));
  document.getElementById('pad-dyang')?.addEventListener('click', () => triggerPad('pad-dyang', () => audioEngine.playDyang(1.0)));
  document.getElementById('pad-ta')?.addEventListener('click', () => triggerPad('pad-ta', () => audioEngine.playTa(1.0)));
  document.getElementById('pad-kut')?.addEventListener('click', () => triggerPad('pad-kut', () => audioEngine.playKut(1.0)));
  document.getElementById('pad-gurgur')?.addEventListener('click', () => triggerPad('pad-gurgur', () => audioEngine.playGurgur(1.0, 6)));
  document.getElementById('pad-kashor')?.addEventListener('click', () => triggerPad('pad-kashor', () => audioEngine.playKansor(1.0, 'CLANG_HIGH')));

  // BPM Slider
  bpmSlider?.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    dhakSequencer.setBpm(val);
    if (bpmVal) bpmVal.textContent = `${val} BPM`;
  });

  // Tap Tempo
  let tapTimes = [];
  tapTempoBtn?.addEventListener('click', () => {
    const now = Date.now();
    tapTimes.push(now);
    tapTimes = tapTimes.filter((t) => now - t < 3000);

    if (tapTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimes.length; i++) {
        intervals.push(tapTimes[i] - tapTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      const clampedBpm = Math.max(60, Math.min(180, calculatedBpm));

      dhakSequencer.setBpm(clampedBpm);
      if (bpmSlider) bpmSlider.value = clampedBpm;
      if (bpmVal) bpmVal.textContent = `${clampedBpm} BPM`;
    }
  });

  // Volume Slider
  volSlider?.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    dhakSequencer.setVolume(val / 100);
    if (volVal) volVal.textContent = `${val}%`;
  });

  // Accelerando Toggle
  accelerandoChk?.addEventListener('change', (e) => {
    dhakSequencer.setAccelerando(e.target.checked);
  });

  // Sequencer Play / Stop Bol
  playBtn?.addEventListener('click', () => {
    // Pause live Dhak if playing
    if (ytAudioPlayer.isLiveDhakMode && ytAudioPlayer.isPlaying) {
      ytAudioPlayer.pause();
      state.isLiveDhakPlaying = false;
      updateLiveDhakPlayState(false);
    }

    const isPlaying = dhakSequencer.toggle();
    state.isDhakLooping = isPlaying;

    if (isPlaying) {
      playBtn?.classList.add('loop-active');
      if (playIcon) playIcon.textContent = '⏹';
      if (playText) playText.textContent = 'বোল বন্ধ করুন (Stop Bol)';
    } else {
      playBtn?.classList.remove('loop-active');
      if (playIcon) playIcon.textContent = '▶';
      if (playText) playText.textContent = 'বোল বাজানো শুরু করুন (Play Bol)';
      stepGrid?.querySelectorAll('.step-tile').forEach((t) => t.classList.remove('active-step'));
      if (activeStepLabel) activeStepLabel.textContent = 'Step: -- / 16';
    }
  });

  // Quick Shankha & Kanshor Triggers in Dhak Modal
  document.getElementById('btn-dhak-shankha')?.addEventListener('click', () => {
    audioEngine.playShankha(2.8);
    showShankhaHud();
  });

  document.getElementById('btn-dhak-kashor')?.addEventListener('click', () => {
    audioEngine.playKansor(1.0, 'CLANG_HIGH');
    flashPad('pad-kashor');
  });

  // Initial State: Bol 2
  dhakSequencer.setBol(2);
  updateBolUI(dhakSequencer.currentBol);
}

function showShankhaHud() {
  const hud = document.getElementById('shankha-hud');
  if (hud) {
    hud.classList.add('active');
    setTimeout(() => {
      hud.classList.remove('active');
    }, 2800);
  }
}

/* ==========================================================================
   5. MONDAL BARIR PUJO HERITAGE, SCHEDULE & CATEGORIZED GALLERY
   ========================================================================== */

function initPujoInfoAndGallery() {
  // 1. Render 2026 Schedule Timeline
  const timelineContainer = document.getElementById('pujo-timeline-list');
  if (timelineContainer && nativePujoData.dates2026) {
    timelineContainer.innerHTML = '';
    nativePujoData.dates2026.forEach((item) => {
      const isSpecial = item.id === 'astami' || item.id === 'navami';
      const el = document.createElement('div');
      el.className = `timeline-item ${isSpecial ? 'highlight-item' : ''}`;
      el.innerHTML = `
        <div class="timeline-left">
          <span class="timeline-day">${item.bengaliDay}</span>
          <span class="timeline-note">${item.rituals}</span>
        </div>
        <span class="timeline-date">${item.date}</span>
      `;
      timelineContainer.appendChild(el);
    });
  }

  // 2. Render Heritage Highlights
  const highlightsContainer = document.getElementById('pujo-highlights-grid');
  if (highlightsContainer && nativePujoData.highlights) {
    highlightsContainer.innerHTML = '';
    nativePujoData.highlights.forEach((h) => {
      const card = document.createElement('div');
      card.className = 'highlight-card';
      card.innerHTML = `
        <div class="highlight-card-title">${h.title}</div>
        <div class="highlight-card-desc">${h.desc}</div>
      `;
      highlightsContainer.appendChild(card);
    });
  }

  // 3. Render Gallery Category Filter Tabs
  const catTabsContainer = document.getElementById('gallery-category-tabs');
  if (catTabsContainer && nativePujoData.galleryCategories) {
    catTabsContainer.innerHTML = '';
    nativePujoData.galleryCategories.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = `gallery-cat-btn ${cat.id === state.activeGalleryCategory ? 'active' : ''}`;
      btn.setAttribute('data-category', cat.id);
      btn.textContent = cat.label;
      btn.addEventListener('click', () => {
        state.activeGalleryCategory = cat.id;
        document.querySelectorAll('.gallery-cat-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderGalleryItems();
      });
      catTabsContainer.appendChild(btn);
    });
  }

  // 4. Render Gallery Items
  renderGalleryItems();

  // Open Mondal Barir Pujo Modal
  document.getElementById('btn-open-pujo-info')?.addEventListener('click', () => {
    openModal('pujo-info-modal');
  });
  document.getElementById('mobile-nav-pujo')?.addEventListener('click', () => {
    openModal('pujo-info-modal');
  });

  // Open Story Modal from Pujo Modal
  document.getElementById('btn-modal-open-story')?.addEventListener('click', () => {
    closeModal('pujo-info-modal');
    openModal('story-generator-modal');
    renderStoryCanvas();
  });

  // Share Puja Invitation (WhatsApp / Web Share API)
  const shareBtn = document.getElementById('btn-share-website');
  shareBtn?.addEventListener('click', async () => {
    const shareText = `🌸 পুজো আসছে! মন্ডল বাড়ির পুজো ২০২৬ (ফুরফুরা মণ্ডল পরিবার) • ১৫০+ বছরের ঐতিহ্য ও মিলনমেলা।
🗓️ মহালয়া: ১০ অক্টোবর | মহাষ্টমী ও সন্ধিপূজা: ১৮ অক্টোবর ২০২৬
✨ লাইভ কাউন্টডাউন ও আগমনী রেডিও: ${window.location.href}
📸 Instagram: @furfura_mondal_poribar (${nativePujoData.instagramUrl})`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'মন্ডল বাড়ির পুজো ২০২৬ — পুজো আসছে',
          text: shareText,
          url: window.location.href
        });
      } catch (e) {
        // Fallback to clipboard
        copyTextToClipboard(shareText, shareBtn, '✅ নিমন্ত্রণ লিংক কপি হয়েছে!');
      }
    } else {
      copyTextToClipboard(shareText, shareBtn, '✅ নিমন্ত্রণ লিংক কপি হয়েছে!');
    }
  });
}

function renderGalleryItems() {
  const grid = document.getElementById('pujo-gallery-grid');
  if (!grid) return;

  grid.innerHTML = '';
  const filtered = state.activeGalleryCategory === 'all'
    ? nativePujoData.gallery
    : nativePujoData.gallery.filter((g) => g.category === state.activeGalleryCategory);

  filtered.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.innerHTML = `
      <img class="gallery-img" src="${item.src}" alt="${item.title}" loading="lazy" />
      <div class="gallery-overlay">
        <span class="gallery-tag">${item.categoryLabel || item.category}</span>
        <span class="gallery-title">${item.bengaliTitle || item.title}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      // Dynamically switch atmospheric lighting
      const vibeMap = {
        'gal-1': 'morning',
        'gal-2': 'evening',
        'gal-3': 'night',
        'gal-4': 'early-morning',
        'gal-5': 'afternoon',
        'gal-6': 'midnight'
      };
      if (vibeMap[item.id]) {
        state.activeVibe = vibeMap[item.id];
        updateAtmosphere();
        closeModal('pujo-info-modal');
      }
    });

    grid.appendChild(card);
  });
}

/* ==========================================================================
   6. INSTAGRAM STORY & SHARE CARD GENERATOR
   ========================================================================== */

function initStoryGenerator() {
  // Triggers to open story generator
  document.getElementById('btn-open-story-gen')?.addEventListener('click', () => {
    openModal('story-generator-modal');
    renderStoryCanvas();
  });
  document.getElementById('btn-trig-story-gen')?.addEventListener('click', () => {
    openModal('story-generator-modal');
    renderStoryCanvas();
  });
  document.getElementById('mobile-nav-story')?.addEventListener('click', () => {
    openModal('story-generator-modal');
    renderStoryCanvas();
  });

  // Story Theme Buttons
  const themeBtns = document.querySelectorAll('.story-theme-selector .theme-btn');
  themeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      themeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.storyGen.theme = btn.getAttribute('data-theme');
      renderStoryCanvas();
    });
  });

  // Story Headline Selector
  const headlineSelect = document.getElementById('story-headline-select');
  headlineSelect?.addEventListener('change', (e) => {
    state.storyGen.headline = e.target.value;
    renderStoryCanvas();
  });

  // Checkbox toggles
  document.getElementById('chk-show-countdown')?.addEventListener('change', (e) => {
    state.storyGen.showCountdown = e.target.checked;
    renderStoryCanvas();
  });
  document.getElementById('chk-show-schedule')?.addEventListener('change', (e) => {
    state.storyGen.showSchedule = e.target.checked;
    renderStoryCanvas();
  });
  document.getElementById('chk-show-handle')?.addEventListener('change', (e) => {
    state.storyGen.showHandle = e.target.checked;
    renderStoryCanvas();
  });

  // Download High-Res PNG
  document.getElementById('btn-download-story-png')?.addEventListener('click', () => {
    const canvas = document.getElementById('story-card-canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `mondal-barir-pujo-2026-story-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  // Share Native
  document.getElementById('btn-share-story-native')?.addEventListener('click', async () => {
    const canvas = document.getElementById('story-card-canvas');
    const shareBtn = document.getElementById('btn-share-story-native');
    if (!canvas) return;

    const shareText = `🌸 পুজো আসছে! মন্ডল বাড়ির পুজো ২০২৬ (Furfura Mondal Poribar) • ১৫০+ বছরের ঐতিহ্য। Follow @furfura_mondal_poribar ${nativePujoData.instagramUrl}`;

    if (navigator.share && canvas.toBlob) {
      canvas.toBlob(async (blob) => {
        try {
          const file = new File([blob], 'furfura-mondal-poribar-pujo-story.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'মন্ডল বাড়ির পুজো ২০২৬ (ফুরফুরা মণ্ডল পরিবার)',
              text: shareText,
              files: [file]
            });
            return;
          }
          await navigator.share({
            title: 'মন্ডল বাড়ির পুজো ২০২৬ (ফুরফুরা মণ্ডল পরিবার)',
            text: shareText,
            url: window.location.href
          });
        } catch (err) {
          copyTextToClipboard(shareText, shareBtn, '✅ লিংক ও ক্যাপশন কপি হয়েছে!');
        }
      });
    } else {
      copyTextToClipboard(shareText, shareBtn, '✅ লিংক ও ক্যাপশন কপি হয়েছে!');
    }
  });

  // Copy Caption & Hashtags
  document.getElementById('btn-copy-story-caption')?.addEventListener('click', () => {
    const copyBtn = document.getElementById('btn-copy-story-caption');
    const cd = getCountdown();
    const caption = `🌸 মা আসছেন ঘরে! 

মন্ডল বাড়ির পুজো ২০২৬ (Furfura Mondal Poribar Pujo)
📍 Furfura Mondal Poribar Natmandir, Dankuni / Hooghly, Bengal
⏳ আর মাত্র ${cd.days} দিন বাকি (Maha Shasthi: 16 Oct 2026)

✨ ১৫০+ বছরের ঐতিহ্য, সাবেকি একচালা ডাকের সাজ, ১০৮ পদ্মে সন্ধিপূজা ও ধুনুচি নাচ।
🎵 আগমনী রেডিও ও লাইভ কাউন্টডাউন দেখুন: ${window.location.href}

📸 Follow on Instagram: @furfura_mondal_poribar
🔗 ${nativePujoData.instagramUrl}
#FurfuraMondalPoribar #MondalBarirPujo #মন্ডলবাড়িরপুজো #DurgaPuja2026 #PujoAsche #MondalBariRadio #Agomoni #KolkataDurgaPuja #BonediBariPujo #Dankuni #Hooghly`;

    copyTextToClipboard(caption, copyBtn, '✅ সম্পূর্ণ ক্যাপশন ও হ্যাশট্যাগ কপি হয়েছে!');
  });
}

function renderStoryCanvas() {
  const canvas = document.getElementById('story-card-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;  // 1080
  const height = canvas.height; // 1920

  const theme = state.storyGen.theme || 'early-morning';
  const cd = getCountdown();

  // 1. Theme Color Palettes
  const themeGradients = {
    'early-morning': { top: '#1c102b', mid: '#4a154b', bot: '#ff6f3c', accent: '#ffcf40', gold: '#ffd700' },
    'morning': { top: '#1a365d', mid: '#2b6cb0', bot: '#f6ad55', accent: '#ffe066', gold: '#ffcf40' },
    'evening': { top: '#2d0a1e', mid: '#800020', bot: '#e65100', accent: '#ffd700', gold: '#ffc107' },
    'night': { top: '#080d1a', mid: '#121f3d', bot: '#1e3a8a', accent: '#ffcf40', gold: '#ffd700' },
    'afternoon': { top: '#0c4a6e', mid: '#0284c7', bot: '#38bdf8', accent: '#fef08a', gold: '#facc15' }
  };

  const currentTheme = themeGradients[theme] || themeGradients['early-morning'];

  // 2. Draw Scenic Atmospheric Background Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, currentTheme.top);
  grad.addColorStop(0.45, currentTheme.mid);
  grad.addColorStop(1, currentTheme.bot);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 3. Draw Sacred Traditional Mandala & Starry Ornaments
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 90; i++) {
    const sx = (i * 137.5) % width;
    const sy = (i * 219.3) % height;
    const sr = (i % 3) + 1;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 4. Traditional Alpana Ornamental Borders (Top & Bottom)
  ctx.save();
  ctx.strokeStyle = currentTheme.gold;
  ctx.fillStyle = currentTheme.gold;
  ctx.lineWidth = 3;

  // Outer border frame
  ctx.strokeRect(40, 40, width - 80, height - 80);
  ctx.lineWidth = 1;
  ctx.strokeRect(52, 52, width - 104, height - 104);

  // Corner floral motifs
  const drawCornerMotif = (x, y, flipX, flipY) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flipX, flipY);
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(16, 16, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawCornerMotif(52, 52, 1, 1);
  drawCornerMotif(width - 52, 52, -1, 1);
  drawCornerMotif(52, height - 52, 1, -1);
  drawCornerMotif(width - 52, height - 52, -1, -1);
  ctx.restore();

  // 5. Header Header Badge: "মন্ডল বাড়ির পুজো • ১৫০+ বছরের ঐতিহ্য"
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  roundRect(ctx, width / 2 - 290, 100, 580, 60, 30);
  ctx.fill();
  ctx.strokeStyle = currentTheme.gold;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 24px "Noto Sans Bengali", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🪔 মন্ডল বাড়ির পুজো • ১৫০+ বছরের ঐতিহ্য', width / 2, 138);
  ctx.restore();

  // 6. Central Sacred Maa Durga Iconography / Mandala
  ctx.save();
  const centerX = width / 2;
  const centerY = 460;

  // Glowing radial aureole
  const aura = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, 220);
  aura.addColorStop(0, 'rgba(255, 207, 64, 0.35)');
  aura.addColorStop(0.6, 'rgba(255, 140, 0, 0.18)');
  aura.addColorStop(1, 'transparent');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 220, 0, Math.PI * 2);
  ctx.fill();

  // Sacred Third Eye (ত্রিনয়ন) & Lotus Icon
  ctx.fillStyle = currentTheme.gold;
  ctx.font = '120px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🔱', centerX, centerY + 20);

  // Subtitle Sacred Shloka
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '500 28px "Noto Sans Bengali", sans-serif';
  ctx.fillText('যা দেবী সর্বভূতেষু মাতৃরূপেণ সংস্থিতা', centerX, centerY + 130);
  ctx.restore();

  // 7. Bengali Display Headline (পুজো আসছে / শুভ শারদীয়া)
  ctx.save();
  ctx.textAlign = 'center';

  const headlinesMap = {
    'pujo-asche': { top: 'পুজো', bot: 'আসছে', full: 'মন্ডল বাড়ির পুজো ২০২৬' },
    'subho-saradiya': { top: 'শুভ', bot: 'শারদীয়া', full: 'মন্ডল বাড়ির দুর্গাপূজা' },
    'maa-aschen': { top: 'মা আসছেন', bot: 'ঘরে', full: '১৫০+ বছরের ঐতিহ্য ও আনন্দ' },
    'sandhi-puja': { top: '১০৮ পদ্মে', bot: 'সন্ধিপূজা', full: 'মহামিলনোৎসবে সপরিবারে আমন্ত্রণ' }
  };

  const selectedHead = headlinesMap[state.storyGen.headline] || headlinesMap['pujo-asche'];

  // Dual Line Main Calligraphy
  ctx.fillStyle = currentTheme.gold;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 24;
  ctx.font = '900 130px "Galada", "Noto Sans Bengali", cursive';
  ctx.fillText(selectedHead.top, centerX, 760);
  ctx.fillText(selectedHead.bot, centerX, 910);
  ctx.shadowBlur = 0;

  // Sub headline
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 36px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText(selectedHead.full, centerX, 980);
  ctx.restore();

  // 8. Live Countdown Badge
  if (state.storyGen.showCountdown) {
    ctx.save();
    const countBoxY = 1040;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    roundRect(ctx, centerX - 360, countBoxY, 720, 130, 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = currentTheme.gold;
    ctx.font = '800 52px "Poppins", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⏳ ${cd.days} DAYS TO GO`, centerX, countBoxY + 62);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '500 26px "Noto Sans Bengali", sans-serif';
    ctx.fillText('মহা ষষ্ঠী: ১৬ অক্টোবর ২০২৬ (শুক্রবার)', centerX, countBoxY + 104);
    ctx.restore();
  }

  // 9. 2026 Puja Schedule Summary Box
  if (state.storyGen.showSchedule) {
    ctx.save();
    const schedBoxY = state.storyGen.showCountdown ? 1200 : 1050;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    roundRect(ctx, centerX - 420, schedBoxY, 840, 290, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 207, 64, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = currentTheme.gold;
    ctx.font = '700 24px "Noto Sans Bengali", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦ পূজার নির্ঘণ্ট ২০২৬ ✦', centerX, schedBoxY + 45);

    const scheduleLines = [
      { day: 'মহালয়া', date: '১০ অক্টোবর (ভোর ৪:৩০ চণ্ডীপাঠ)' },
      { day: 'মহা ষষ্ঠী', date: '১৬ অক্টোবর (বোধন ও আমন্ত্রণ)' },
      { day: 'মহা সপ্তমী', date: '১৭ অক্টোবর (নবপত্রিকা প্রবেশ)' },
      { day: 'মহা অষ্টমী', date: '১৮ অক্টোবর (১০৮ পদ্ম ও প্রদীপে সন্ধিপূজা)' },
      { day: 'মহা নবমী', date: '১৯ অক্টোবর (মহাপ্রসাদ ও ধুনুচি নাচ)' },
      { day: 'বিজয়া দশমী', date: '২০ অক্টোবর (সিঁদুর খেলা ও শান্তিজল)' }
    ];

    ctx.font = '500 21px "Noto Sans Bengali", sans-serif';
    scheduleLines.forEach((s, idx) => {
      const y = schedBoxY + 82 + idx * 34;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffdf7a';
      ctx.fillText(`• ${s.day}:`, centerX - 380, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(s.date, centerX + 380, y);
    });
    ctx.restore();
  }

  // 10. Dhak Rhythm Visualizer & Instagram Handle Banner
  ctx.save();
  const footerY = height - 200;

  // Simulated Rhythm waveform bars
  const barCount = 28;
  const barWidth = 14;
  const barGap = 12;
  const totalWaveW = barCount * (barWidth + barGap);
  const startX = (width - totalWaveW) / 2;

  ctx.fillStyle = currentTheme.gold;
  for (let b = 0; b < barCount; b++) {
    const waveH = Math.sin((b / barCount) * Math.PI) * 36 + Math.random() * 12 + 8;
    const bx = startX + b * (barWidth + barGap);
    ctx.beginPath();
    roundRect(ctx, bx, footerY - waveH / 2, barWidth, waveH, 4);
    ctx.fill();
  }

  // Instagram Handle Pill
  if (state.storyGen.showHandle) {
    const handleY = height - 110;
    ctx.fillStyle = '#e1306c';
    ctx.beginPath();
    roundRect(ctx, centerX - 240, handleY - 32, 480, 58, 29);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 24px "Poppins", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📸 @furfura_mondal_poribar', centerX, handleY + 6);
  }
  ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/* ==========================================================================
   7. KEYBOARD SHORTCUTS & MODAL CONTROLS
   ========================================================================== */

function initKeyboardShortcuts() {
  document.getElementById('btn-open-shortcuts')?.addEventListener('click', () => {
    openModal('shortcuts-modal');
  });

  const flashKeyPad = (padId) => {
    const el = document.getElementById(padId);
    if (el) {
      el.classList.add('hit');
      setTimeout(() => el.classList.remove('hit'), 140);
    }
  };

  window.addEventListener('keydown', (e) => {
    // Avoid triggering when user is typing in form inputs or selects
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    const key = e.key;

    // Space: Play / Pause Radio or Sequencer
    if (key === ' ' || e.code === 'Space') {
      e.preventDefault();
      const dhakModal = document.getElementById('dhak-modal');
      if (dhakModal?.classList.contains('active')) {
        const isPlaying = dhakSequencer.toggle();
        state.isDhakLooping = isPlaying;
        const playBtn = document.getElementById('btn-loop-dhak-rhythm');
        const playIcon = document.getElementById('dhak-play-icon');
        const playText = document.getElementById('dhak-play-text');
        if (isPlaying) {
          playBtn?.classList.add('loop-active');
          if (playIcon) playIcon.textContent = '⏹';
          if (playText) playText.textContent = 'বোল বন্ধ করুন (Stop Bol)';
        } else {
          playBtn?.classList.remove('loop-active');
          if (playIcon) playIcon.textContent = '▶';
          if (playText) playText.textContent = 'বোল বাজানো শুরু করুন (Play Bol)';
          document.querySelectorAll('.step-tile').forEach((t) => t.classList.remove('active-step'));
        }
      } else {
        handleTogglePlay();
      }
    }
    // Arrow Right or 'N': Next track
    else if (key === 'ArrowRight' || key.toLowerCase() === 'n') {
      playNextTrack();
    }
    // Arrow Left or 'P': Previous track
    else if (key === 'ArrowLeft') {
      playPrevTrack();
    }
    // 'S': Sacred Shankha
    else if (key.toLowerCase() === 's') {
      audioEngine.playShankha(2.8);
      showShankhaHud();
    }
    // 'D': Dhak Studio Modal
    else if (key.toLowerCase() === 'd') {
      openModal('dhak-modal');
    }
    // '1': Dhak Bass (ধা)
    else if (key === '1') {
      flashKeyPad('pad-dha');
      audioEngine.playDha(1.0);
    }
    // '2': Dhak Bamboo Snap (ড্যাং)
    else if (key === '2') {
      flashKeyPad('pad-dyang');
      audioEngine.playDyang(1.0);
    }
    // '3': Dhak Rim Slap (তা)
    else if (key === '3') {
      flashKeyPad('pad-ta');
      audioEngine.playTa(1.0);
    }
    // '4': Dhak Ghost Mute (কুট)
    else if (key === '4') {
      flashKeyPad('pad-kut');
      audioEngine.playKut(1.0);
    }
    // '5': Dhak Fast Micro-Roll (গুড়গুড়)
    else if (key === '5') {
      flashKeyPad('pad-gurgur');
      audioEngine.playGurgur(1.0, 6);
    }
    // '6': Kanshor Bell (কাঁসর ঘণ্টা)
    else if (key === '6') {
      flashKeyPad('pad-kashor');
      audioEngine.playKansor(1.0, 'CLANG_HIGH');
    }
    // 'I': Instagram Story Generator
    else if (key.toLowerCase() === 'i') {
      openModal('story-generator-modal');
      renderStoryCanvas();
    }
    // 'F': Toggle Flowers
    else if (key.toLowerCase() === 'f') {
      const toggleBtn = document.getElementById('btn-toggle-particles');
      if (particles) {
        const isRunning = particles.toggle();
        if (toggleBtn) toggleBtn.style.opacity = isRunning ? '1' : '0.4';
      }
    }
    // 'M': Mondal Barir Pujo Info
    else if (key.toLowerCase() === 'm') {
      openModal('pujo-info-modal');
    }
    // '?': Keyboard Shortcuts Modal
    else if (key === '?') {
      openModal('shortcuts-modal');
    }
    // 'Escape': Close active modal
    else if (key === 'Escape') {
      closeAllModals();
    }
  });
}

function initModals() {
  // Close buttons
  document.getElementById('btn-close-playlists')?.addEventListener('click', () => closeModal('playlists-modal'));
  document.getElementById('btn-close-pujo-info')?.addEventListener('click', () => closeModal('pujo-info-modal'));
  document.getElementById('btn-close-story-gen')?.addEventListener('click', () => closeModal('story-generator-modal'));
  document.getElementById('btn-close-shortcuts')?.addEventListener('click', () => closeModal('shortcuts-modal'));

  const resetDhakPlayButton = () => {
    dhakSequencer.stop();
    state.isDhakLooping = false;
    if (ytAudioPlayer.isLiveDhakMode && ytAudioPlayer.isPlaying) {
      ytAudioPlayer.pause();
    }
    state.isLiveDhakPlaying = false;
    updateLiveDhakPlayState(false);

    const playBtn = document.getElementById('btn-loop-dhak-rhythm');
    const playIcon = document.getElementById('dhak-play-icon');
    const playText = document.getElementById('dhak-play-text');
    const activeStepLabel = document.getElementById('dhak-active-step-label');

    playBtn?.classList.remove('loop-active');
    if (playIcon) playIcon.textContent = '▶';
    if (playText) playText.textContent = 'বোল বাজানো শুরু করুন (Play Bol)';
    document.querySelectorAll('.step-tile').forEach((t) => t.classList.remove('active-step'));
    if (activeStepLabel) activeStepLabel.textContent = 'Step: -- / 16';
  };

  // Dhak close with stopping audio sequencer
  document.getElementById('btn-close-dhak')?.addEventListener('click', () => {
    closeModal('dhak-modal');
    resetDhakPlayButton();
  });

  // Close when clicking modal backdrop outside modal-card
  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove('active');
        if (backdrop.id === 'dhak-modal') {
          resetDhakPlayButton();
        }
      }
    });
  });
}

function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add('active');
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove('active');
}

function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach((b) => b.classList.remove('active'));
  audioEngine.stopAll();
}

function copyTextToClipboard(text, btnElement, successMsg) {
  navigator.clipboard.writeText(text).then(() => {
    if (btnElement) {
      const origHtml = btnElement.innerHTML;
      btnElement.innerHTML = `<span>${successMsg}</span>`;
      setTimeout(() => {
        btnElement.innerHTML = origHtml;
      }, 3000);
    }
  }).catch(() => {
    // fallback
  });
}

/* ==========================================================================
   8. PARTICLES SYSTEM INITIALIZATION
   ========================================================================== */

function initParticles() {
  particles = new ParticleSystem('particle-canvas');
  particles.init();
  particles.setTimeOfDay(state.currentVibeTime);

  const toggleBtn = document.getElementById('btn-toggle-particles');
  const mobToggleBtn = document.getElementById('mobile-nav-particles');

  const handleParticleToggle = () => {
    if (!particles) return;
    const isRunning = particles.toggle();
    if (toggleBtn) toggleBtn.style.opacity = isRunning ? '1' : '0.4';
    if (mobToggleBtn) mobToggleBtn.style.opacity = isRunning ? '1' : '0.4';
  };

  toggleBtn?.addEventListener('click', handleParticleToggle);
  mobToggleBtn?.addEventListener('click', handleParticleToggle);
}
