import { playlists, nativePujoData, authenticLiveDhakParts, liveDhakMeta, photoRiverRows, onnotaCategories, onnotaCreations } from './data/playlists.js';
import { ytAudioPlayer } from './audio/youtubePlayer.js';
import { bgAmbience } from './audio/backgroundAmbience.js';
import { audioEngine } from './audio/soundEffects.js';
import { ParticleSystem } from './effects/particles.js';
import { getTimeOfDay, getCountdown, toBengaliNumerals } from './utils/timeUtils.js';
import { getLanguage, setLanguage, updateAppLanguage, getSavedLanguage, t, applyTranslations, formatNumber } from './utils/i18n.js';
import { loginWithGoogle, logoutUser, subscribeAuthState, getCurrentUser, setStoredUser, generateAvatarUrl } from './services/firebaseAuth.js';

// Application State
const state = {
  lang: 'bn', // Current active UI language ('bn' or 'en')
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
  isUserScrubbing: false,
  activeGalleryCategory: 'all',
  activeOnnotaCategory: 'all',
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

// Force browser to disable automatic scroll restoration so page always lands on Hero section
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// Immediate top scroll lock
window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

document.addEventListener('DOMContentLoaded', () => {
  // Clear any anchor hash on initial load so user starts on Hero section
  if (window.location.hash && window.location.hash !== '#hero-section') {
    try {
      history.replaceState(null, '', window.location.pathname);
    } catch (_) {}
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

  // Initialize Stored Language Preference
  try {
    const savedLang = getSavedLanguage();
    state.lang = savedLang;
    setLanguage(savedLang);
  } catch (e) {
    state.lang = 'bn';
    setLanguage('bn');
  }

  initAtmosphere();
  initDynamicIsland();
  initCountdown();
  initOnlineCounter();
  initAudioPlayer();
  initModals();
  initWelcomeModal();
  initLanguageSwitcher();
  initPujoInfoAndGallery();
  initInvitationSection();
  initPhotoRiver();
  initGrandGallery();
  initOnnotaSection();
  initStoryGenerator();
  initKeyboardShortcuts();
  initParticles();
  initSectionScrollLocking();

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

  // Vibe Selection in Island
  document.querySelectorAll('.island-vibe-chip[data-vibe]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const selectedVibe = btn.getAttribute('data-vibe');
      state.activeVibe = selectedVibe;
      updateAtmosphere();
    });
  });
}

function updateAtmosphere() {
  const currentHour = new Date().getHours();
  const autoVibe = (currentHour >= 6 && currentHour < 18) ? 'morning' : 'night';
  const effectiveTime = state.activeVibe === 'auto' ? autoVibe : (state.activeVibe === 'night' ? 'night' : 'morning');
  state.currentVibeTime = effectiveTime;

  document.documentElement.setAttribute('data-theme', effectiveTime);

  // Switch background picture layers and inner img elements
  const morningPicture = document.getElementById('bg-layer-morning');
  const nightPicture = document.getElementById('bg-layer-night');
  const morningImg = document.getElementById('bg-morning');
  const nightImg = document.getElementById('bg-night');

  if (effectiveTime === 'night') {
    morningPicture?.classList.remove('active');
    morningImg?.classList.remove('active');
    nightPicture?.classList.add('active');
    nightImg?.classList.add('active');
  } else {
    nightPicture?.classList.remove('active');
    nightImg?.classList.remove('active');
    morningPicture?.classList.add('active');
    morningImg?.classList.add('active');
  }

  // Update active state on island vibe chips
  document.querySelectorAll('.island-vibe-chip[data-vibe]').forEach((chip) => {
    const chipVibe = chip.getAttribute('data-vibe');
    const isActive = chipVibe === state.activeVibe;
    chip.classList.toggle('active', isActive);
    chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  // Update particles color & lighting theme
  if (particles && typeof particles.setTimeOfDay === 'function') {
    particles.setTimeOfDay(effectiveTime);
  }
}

/* ==========================================================================
   2. MOBILE FLOATING DYNAMIC ISLAND SYSTEM
   ========================================================================== */


/* ==========================================================================
   2.5. FIREBASE GOOGLE AUTHENTICATION SYSTEM (DYNAMIC ISLAND & PROFILE)
   ========================================================================== */

function showAuthToast(message) {
  let toast = document.getElementById('auth-floating-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'auth-floating-toast';
    toast.className = 'auth-floating-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

function initFirebaseAuthUI() {
  const authBtn = document.getElementById('island-google-auth-btn');
  const userPill = document.getElementById('island-user-pill');
  const userAvatar = document.getElementById('island-user-avatar');
  const userName = document.getElementById('island-user-name');
  const logoutBtn = document.getElementById('island-btn-logout');

  const drawerUserImg = document.getElementById('drawer-user-img');
  const drawerUserName = document.getElementById('drawer-user-name');
  const drawerUserSub = document.getElementById('drawer-user-sub');
  const drawerAuthBtn = document.getElementById('drawer-btn-auth');
  const drawerAuthBtnText = document.getElementById('drawer-auth-btn-text');

  const googleModal = document.getElementById('google-signin-modal');
  const closeGoogleModalBtn = document.getElementById('btn-close-google-auth');
  const quickDevoteeBtn = document.getElementById('btn-quick-auth-devotee');
  const quickFamilyBtn = document.getElementById('btn-quick-auth-family');
  const customAuthForm = document.getElementById('google-custom-auth-form');

  let pendingAuthCallback = null;

  window.openGoogleAuthModal = function(callback) {
    pendingAuthCallback = callback;
    if (googleModal) {
      googleModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  function closeGoogleAuthModal() {
    if (googleModal) {
      googleModal.classList.remove('active');
      const anyOtherModal = document.querySelector('.modal-backdrop.active');
      if (!anyOtherModal) {
        document.body.style.overflow = '';
      }
    }
    pendingAuthCallback = null;
  }

  closeGoogleModalBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeGoogleAuthModal();
  });

  googleModal?.addEventListener('click', (e) => {
    if (e.target === googleModal) {
      closeGoogleAuthModal();
    }
  });

  const completeUserLogin = (user) => {
    const lang = getLanguage();
    setStoredUser(user);
    updateAuthUI(user);
    closeGoogleAuthModal();
    const welcomeMsg = lang === 'bn' 
      ? `Google সাইন ইন সফল হয়েছে! স্বাগতম, ${user.displayName}` 
      : `Signed in with Google! Welcome, ${user.displayName}`;
    showAuthToast(welcomeMsg);
    if (typeof audioEngine?.playDiyaLight === 'function') {
      audioEngine.playDiyaLight();
    }
  };

  quickDevoteeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const lang = getLanguage();
    const name = lang === 'bn' ? 'ভক্ত ও দর্শনার্থী' : 'Devotee & Visitor';
    const user = {
      uid: 'google-devotee-' + Date.now(),
      displayName: name,
      email: 'devotee@mondalbari.org',
      photoURL: generateAvatarUrl(name),
      isFirebaseLive: false
    };
    completeUserLogin(user);
  });

  quickFamilyBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const lang = getLanguage();
    const name = lang === 'bn' ? 'মণ্ডল পরিবার অতিথি' : 'Mondal Family Guest';
    const user = {
      uid: 'google-family-' + Date.now(),
      displayName: name,
      email: 'family@mondalbari.org',
      photoURL: generateAvatarUrl(name),
      isFirebaseLive: false
    };
    completeUserLogin(user);
  });

  customAuthForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nameInput = document.getElementById('auth-input-name');
    const emailInput = document.getElementById('auth-input-email');
    const nameVal = (nameInput?.value || '').trim() || 'Devotee';
    const emailVal = (emailInput?.value || '').trim() || 'devotee@gmail.com';

    const user = {
      uid: 'google-user-' + Date.now(),
      displayName: nameVal,
      email: emailVal,
      photoURL: generateAvatarUrl(nameVal, emailVal),
      isFirebaseLive: false
    };
    completeUserLogin(user);
  });

  const updateAuthUI = (user) => {
    const lang = getLanguage();
    if (user) {
      // 1. Signed In State
      if (authBtn) authBtn.style.display = 'none';
      if (userPill) userPill.style.display = 'inline-flex';
      if (userAvatar) {
        userAvatar.src = user.photoURL || generateAvatarUrl(user.displayName);
        userAvatar.alt = user.displayName || 'User Profile';
      }
      if (userName) {
        const firstName = (user.displayName || 'User').split(' ')[0];
        userName.textContent = firstName;
      }

      // Drawer details
      if (drawerUserImg) {
        drawerUserImg.src = user.photoURL || generateAvatarUrl(user.displayName);
        drawerUserImg.style.display = 'block';
      }
      const guestIcon = document.querySelector('.account-guest-icon');
      if (guestIcon) guestIcon.style.display = 'none';

      if (drawerUserName) drawerUserName.textContent = user.displayName || 'Devotee';
      if (drawerUserSub) drawerUserSub.textContent = user.email || (lang === 'bn' ? 'সংযুক্ত ভক্ত' : 'Connected Devotee');
      if (drawerAuthBtnText) drawerAuthBtnText.textContent = lang === 'bn' ? 'লগআউট' : 'Sign Out';
      if (drawerAuthBtn) {
        drawerAuthBtn.classList.add('btn-signout');
        drawerAuthBtn.onclick = async (e) => {
          e.stopPropagation();
          await logoutUser();
          showAuthToast(lang === 'bn' ? 'লগআউট সম্পন্ন হয়েছে' : 'Signed out successfully');
        };
      }

      // Autofill Contributor name in Photo Upload if empty
      const authorInput = document.getElementById('gallery-author-input');
      if (authorInput && !authorInput.value.trim()) {
        authorInput.value = user.displayName || '';
      }
    } else {
      // 2. Signed Out / Guest State
      if (authBtn) authBtn.style.display = 'inline-flex';
      if (userPill) userPill.style.display = 'none';

      if (drawerUserImg) {
        drawerUserImg.style.display = 'none';
      }
      const guestIcon = document.querySelector('.account-guest-icon');
      if (guestIcon) guestIcon.style.display = 'block';

      if (drawerUserName) drawerUserName.textContent = lang === 'bn' ? 'ভক্ত ও দর্শনার্থী' : 'Devotee & Visitor';
      if (drawerUserSub) drawerUserSub.textContent = lang === 'bn' ? 'ঐচ্ছিক Google অ্যাকাউন্ট' : 'Optional Google Account';
      if (drawerAuthBtnText) drawerAuthBtnText.textContent = lang === 'bn' ? 'Google সাইন ইন' : 'Google Sign In';
      if (drawerAuthBtn) {
        drawerAuthBtn.classList.remove('btn-signout');
        drawerAuthBtn.onclick = async (e) => {
          e.stopPropagation();
          try {
            const user = await loginWithGoogle();
            if (user) {
              completeUserLogin(user);
            }
          } catch (err) {
            console.warn('Google sign-in notice:', err);
          }
        };
      }
    }
  };

  authBtn?.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      const user = await loginWithGoogle();
      if (user) {
        completeUserLogin(user);
      }
    } catch (err) {
      console.warn('Google sign-in notice:', err);
    }
  });

  logoutBtn?.addEventListener('click', async (e) => {
    e.stopPropagation();
    const lang = getLanguage();
    await logoutUser();
    showAuthToast(lang === 'bn' ? 'লগআউট সম্পন্ন হয়েছে' : 'Signed out successfully');
  });

  // Re-sync UI on language change
  window.addEventListener('pujo_language_changed', () => {
    updateAuthUI(getCurrentUser());
  });

  // Listen for live Firebase auth state changes
  subscribeAuthState((user) => {
    updateAuthUI(user);
  });

  // Initial Sync
  updateAuthUI(getCurrentUser());
}

function initDynamicIsland() {
  const island = document.getElementById('dynamic-island');
  const btnExpand = document.getElementById('btn-island-expand');
  const btnActiveExpand = document.getElementById('btn-island-active-expand');
  const idleTapTarget = document.getElementById('island-idle-tap-target');
  const activeTapTarget = document.getElementById('island-active-tap-target');
  const islandPlayPause = document.getElementById('island-btn-play-pause');

  const toggleDrawer = (e) => {
    e?.stopPropagation();
    island?.classList.toggle('drawer-open');
  };

  btnExpand?.addEventListener('click', toggleDrawer);
  btnActiveExpand?.addEventListener('click', toggleDrawer);

  // Idle Island Tap -> Opens Mondal Barir Pujo Heritage & Schedule
  idleTapTarget?.addEventListener('click', (e) => {
    e.stopPropagation();
    openModal('pujo-info-modal');
  });

  // Active Island Tap -> Opens Player Sheet (Playlists or Dhak)
  activeTapTarget?.addEventListener('click', () => {
    openModal('playlists-modal');
  });

  // Island Play / Pause Touch Trigger
  islandPlayPause?.addEventListener('click', (e) => {
    e.stopPropagation();
    handleTogglePlay();
    updateDynamicIslandState();
  });

  // Quick Action Hub Buttons inside Island
  

  

  document.getElementById('island-quick-radio')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openModal('playlists-modal');
    island?.classList.remove('drawer-open');
  });

  document.getElementById('island-quick-particles')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (particles) particles.toggle();
    island?.classList.remove('drawer-open');
  });

  document.getElementById('island-quick-story')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openModal('story-generator-modal');
    renderStoryCanvas();
    island?.classList.remove('drawer-open');
  });

  document.getElementById('island-quick-gallery')?.addEventListener('click', (e) => {
    e.stopPropagation();
    island?.classList.remove('drawer-open');
    smoothScrollToSection('gallery-section', 620);
  });

  document.getElementById('island-quick-heritage')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openModal('pujo-info-modal');
    island?.classList.remove('drawer-open');
  });

  // Atmosphere Chips inside Island
  document.querySelectorAll('.island-vibe-chip').forEach((chip) => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const selectedVibe = chip.getAttribute('data-vibe');
      state.activeVibe = selectedVibe;
      updateAtmosphere();
      island?.classList.remove('drawer-open');
    });
  });

  // Close island drawer when tapping outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#universal-dynamic-island-container')) {
      island?.classList.remove('drawer-open');
    }
  });

  updateDynamicIslandState();
}

function updateDynamicIslandState() {
  const idleState = document.getElementById('island-idle-state');
  const activeState = document.getElementById('island-active-state');
  const islandIconPlay = document.getElementById('island-icon-play');
  const islandIconPause = document.getElementById('island-icon-pause');
  const islandTrackTitle = document.getElementById('island-track-title');
  const islandArtistName = document.getElementById('island-artist-name');
  const islandArtImg = document.getElementById('island-art-img');
  const islandPlayingIcon = document.getElementById('island-playing-icon');
  const lang = getLanguage();

  if (state.isLiveDhakPlaying) {
    if (idleState) idleState.style.display = 'none';
    if (activeState) activeState.style.display = 'flex';
    if (islandIconPlay) islandIconPlay.style.display = 'none';
    if (islandIconPause) islandIconPause.style.display = 'block';
    if (islandPlayingIcon) islandPlayingIcon.textContent = '';

    const part = authenticLiveDhakParts[state.currentLiveDhakIndex];
    if (islandTrackTitle) islandTrackTitle.textContent = (lang === 'bn' ? part?.title_bn : part?.title_en) || (lang === 'bn' ? 'খাঁটি ঢাকের বোল' : 'Authentic Dhak Beats');
    if (islandArtistName) islandArtistName.textContent = lang === 'bn' ? 'ঢাকের ৬টি পর্ব ও লুপ' : '6 Authentic Dhak Parts & Loops';
    if (islandArtImg) islandArtImg.src = '/favicon.png';
  } else if (state.isAudioPlaying) {
    if (idleState) idleState.style.display = 'none';
    if (activeState) activeState.style.display = 'flex';
    if (islandIconPlay) islandIconPlay.style.display = 'none';
    if (islandIconPause) islandIconPause.style.display = 'block';
    if (islandPlayingIcon) islandPlayingIcon.textContent = '';

    const track = getCurrentTrack();
    if (islandTrackTitle) islandTrackTitle.textContent = (lang === 'bn' ? (track?.title_bn || track?.title) : (track?.title || track?.title_bn)) || 'Dugga Elo';
    if (islandArtistName) islandArtistName.textContent = track?.artist || (lang === 'bn' ? 'মন্ডল বাড়ি রেডিও' : 'Mondal Bari Radio');
    if (islandArtImg) {
      islandArtImg.src = getTrackThumbnail(track);
      islandArtImg.onerror = () => { islandArtImg.src = 'https://img.youtube.com/vi/xlElO06nQy8/hqdefault.jpg'; };
    }
  } else {
    if (idleState) idleState.style.display = 'flex';
    if (activeState) activeState.style.display = 'none';
    if (islandIconPlay) islandIconPlay.style.display = 'block';
    if (islandIconPause) islandIconPause.style.display = 'none';
  }
}

/* ==========================================================================
   3. COUNTDOWN & ONLINE LIVE COUNTER
   ========================================================================== */

function initCountdown() {
  function tick() {
    const cd = getCountdown();
    const lang = getLanguage();
    const daysEl = document.getElementById('countdown-days-val');
    const hoursEl = document.getElementById('countdown-hours-val');
    const minsEl = document.getElementById('countdown-mins-val');
    const secsEl = document.getElementById('countdown-secs-val');
    const labelEl = document.getElementById('countdown-sub-label');

    if (daysEl) {
      daysEl.textContent = formatNumber(cd.days, lang);
    }
    if (hoursEl) {
      const hStr = cd.hours < 10 ? `0${cd.hours}` : String(cd.hours);
      hoursEl.textContent = formatNumber(hStr, lang);
    }
    if (minsEl) {
      const mStr = cd.minutes < 10 ? `0${cd.minutes}` : String(cd.minutes);
      minsEl.textContent = formatNumber(mStr, lang);
    }
    if (secsEl) {
      const sStr = cd.seconds < 10 ? `0${cd.seconds}` : String(cd.seconds);
      secsEl.textContent = formatNumber(sStr, lang);
    }
    if (labelEl) {
      labelEl.textContent = lang === 'bn' 
        ? 'মহা ষষ্ঠী: ১৬ অক্টোবর ২০২৬ • নির্ঘণ্ট ও সূচি'
        : 'Maha Sasthi: 16 October 2026 • Full Schedule';
    }
  }

  tick();
  setInterval(tick, 1000);

  // Click on countdown card opens Mondal Barir Pujo Info / Schedule
  document.getElementById('btn-countdown-details')?.addEventListener('click', () => {
    openModal('pujo-info-modal');
  });
}

function initOnlineCounter() {
  const countText = document.getElementById('online-count-text');
  const islandCountText = document.getElementById('island-online-text');

  setInterval(() => {
    // Subtle realistic organic fluctuation (+/- 2)
    const change = Math.floor(Math.random() * 5) - 2;
    state.onlineCount = Math.max(42, Math.min(94, state.onlineCount + change));
    const lang = getLanguage();
    if (countText) {
      countText.textContent = lang === 'bn' 
        ? `${formatNumber(state.onlineCount, 'bn')} জন ভক্ত অনলাইনে`
        : `${state.onlineCount} devotees online`;
    }
    if (islandCountText) {
      islandCountText.textContent = `${formatNumber(state.onlineCount, lang)}`;
    }
  }, 4500);
}

/* ==========================================================================
   3. AUDIO PLAYER & DUAL PLAYLISTS SYSTEM
   ========================================================================== */

function initAudioPlayer() {
  const currentList = playlists[state.currentPlaylistKey]?.tracks || [];
  const initialTrack = currentList[0];
  updatePlayerUI(initialTrack);

  // Subscribe to YouTube Player Events
  ytAudioPlayer.subscribe((event) => {
    if (event.type === 'state') {
      state.isAudioPlaying = event.isPlaying;
      updatePlayPauseButton(event.isPlaying);
      updateArtVinylAnimation(event.isPlaying);
      updateEqualizerAnimation();
    } else if (event.type === 'trackChange') {
      if (event.playlistKey) state.currentPlaylistKey = event.playlistKey;
      updatePlayerUI(event.track);
      updateEqualizerAnimation();
    } else if (event.type === 'timeUpdate') {
      updateScrubber(event.currentTime, event.duration, event.progress);
    } else if (event.type === 'ended') {
      playNextTrack();
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

  // Scrubber Drag & Touch Handling with Zero-Jitter Interactivity
  const scrubber = document.getElementById('player-scrubber');
  if (scrubber) {
    const handleScrubStart = () => {
      state.isUserScrubbing = true;
    };
    const handleScrubEnd = (e) => {
      const val = parseFloat(e.target.value);
      const track = getCurrentTrack();
      const trackStart = track?.start || 0;
      const trackEnd = (track?.end !== undefined && track?.end !== null) ? track.end : null;
      const duration = track?.duration || (trackEnd !== null ? (trackEnd - trackStart) : 200);
      const targetSeconds = (val / 100) * duration;
      ytAudioPlayer.seekTo(targetSeconds);
      state.isUserScrubbing = false;
    };
    const handleScrubInput = (e) => {
      state.isUserScrubbing = true;
      const val = parseFloat(e.target.value);
      const track = getCurrentTrack();
      const trackStart = track?.start || 0;
      const trackEnd = (track?.end !== undefined && track?.end !== null) ? track.end : null;
      const duration = track?.duration || (trackEnd !== null ? (trackEnd - trackStart) : 200);
      const curSec = (val / 100) * duration;
      const timeLabel = document.getElementById('player-time-text');
      if (timeLabel) {
        const curMin = Math.floor(curSec / 60);
        const curS = Math.floor(curSec % 60).toString().padStart(2, '0');
        const totMin = Math.floor(duration / 60);
        const totS = Math.floor(duration % 60).toString().padStart(2, '0');
        timeLabel.textContent = `${curMin}:${curS} / ${totMin}:${totS}`;
      }
    };

    scrubber.addEventListener('mousedown', handleScrubStart);
    scrubber.addEventListener('touchstart', handleScrubStart, { passive: true });
    scrubber.addEventListener('input', handleScrubInput);
    scrubber.addEventListener('change', handleScrubEnd);
    scrubber.addEventListener('mouseup', handleScrubEnd);
    scrubber.addEventListener('touchend', handleScrubEnd);
  }

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

  // Desktop Dock Minimize & Floating Launcher Toggle
  const desktopDock = document.getElementById('desktop-dock-wrapper');
  const btnMinimizeDock = document.getElementById('btn-minimize-dock');
  const btnFloatingLauncher = document.getElementById('btn-floating-music-launcher');

  btnMinimizeDock?.addEventListener('click', (e) => {
    e.stopPropagation();
    desktopDock?.classList.add('minimized');
    if (btnFloatingLauncher) btnFloatingLauncher.style.display = 'inline-flex';
  });

  btnFloatingLauncher?.addEventListener('click', (e) => {
    e.stopPropagation();
    desktopDock?.classList.remove('minimized');
  });

  // Mobile Drawer Minimize & Floating Launcher Toggle
  const mobileDrawer = document.getElementById('mobile-system-wrapper');
  const btnMinimizeMobile = document.getElementById('btn-minimize-mobile-dock');
  const btnMobileFloating = document.getElementById('btn-mobile-floating-music');

  btnMinimizeMobile?.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileDrawer?.classList.add('minimized');
    if (btnMobileFloating) btnMobileFloating.style.display = 'flex';
  });

  btnMobileFloating?.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileDrawer?.classList.remove('minimized');
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
  state.soundEnabled = true;
  if (typeof audioEngine.resumeAudioContext === 'function') {
    audioEngine.resumeAudioContext();
  }
  ytAudioPlayer.setMute(false);
  ytAudioPlayer.setVolume(85);

  const track = getCurrentTrack();
  if (!state.isAudioPlaying) {
    state.isAudioPlaying = true;
    updatePlayPauseButton(true);
    updateArtVinylAnimation(true);
    updateEqualizerAnimation();
    updateDynamicIslandState();
    ytAudioPlayer.loadTrack(track, state.currentPlaylistKey, true);
  } else {
    state.isAudioPlaying = false;
    updatePlayPauseButton(false);
    updateArtVinylAnimation(false);
    updateEqualizerAnimation();
    updateDynamicIslandState();
    ytAudioPlayer.pause();
    if (typeof audioEngine.stopFestivePujaRadio === 'function') {
      audioEngine.stopFestivePujaRadio();
    }
  }
}

function getCurrentTrack() {
  const currentList = playlists[state.currentPlaylistKey]?.tracks || [];
  return currentList[state.currentTrackIndex] || currentList[0];
}

function getTrackThumbnail(track) {
  if (!track) return 'https://img.youtube.com/vi/xlElO06nQy8/hqdefault.jpg';
  if (track.cover && typeof track.cover === 'string' && track.cover.startsWith('http') && track.cover.length > 10 && track.cover !== 'https:') {
    return track.cover;
  }
  if (track.videoId && typeof track.videoId === 'string' && track.videoId.length >= 6) {
    return `https://img.youtube.com/vi/${track.videoId}/hqdefault.jpg`;
  }
  return 'https://img.youtube.com/vi/xlElO06nQy8/hqdefault.jpg';
}

function updatePlayerUI(track) {
  if (!track) return;

  const lang = getLanguage();
  const displayTitle = lang === 'bn' ? (track.title_bn || track.title || 'দুগ্গা এলো') : (track.title || track.title_bn || 'Dugga Elo');
  const displayArtist = `${track.artist || 'Agomoni'}${track.composer ? ` • ${track.composer}` : ''}`;
  const displayCover = getTrackThumbnail(track);
  const displayDuration = track.durationLabel || '3:30';
  const displayPill = playlists[state.currentPlaylistKey]?.pillLabel || 'PUJA RADIO';

  // Desktop Dock Elements
  const titleEl = document.getElementById('player-track-title');
  const artistEl = document.getElementById('player-track-artist');
  const coverImg = document.getElementById('player-cover-img');
  const timeEl = document.getElementById('player-time-text');
  const launcherText = document.getElementById('launcher-pill-text');

  if (titleEl) titleEl.textContent = displayTitle;
  if (artistEl) artistEl.textContent = displayArtist;
  if (coverImg) {
    coverImg.src = displayCover;
    coverImg.onerror = () => { coverImg.src = 'https://img.youtube.com/vi/xlElO06nQy8/hqdefault.jpg'; };
  }
  if (timeEl) timeEl.textContent = `0:00 / ${displayDuration}`;
  if (launcherText) launcherText.textContent = displayPill;

  // Floating Music Launcher Sync
  const floatingPillTitle = document.getElementById('floating-pill-title');
  if (floatingPillTitle) floatingPillTitle.textContent = displayTitle;

  // Mobile Elements
  const mobTitleEl = document.getElementById('mobile-track-title');
  const mobArtistEl = document.getElementById('mobile-track-artist');
  const mobCoverImg = document.getElementById('mobile-cover-img');

  if (mobTitleEl) mobTitleEl.textContent = displayTitle;
  if (mobArtistEl) mobArtistEl.textContent = displayArtist;
  if (mobCoverImg) {
    mobCoverImg.src = displayCover;
    mobCoverImg.onerror = () => { mobCoverImg.src = 'https://img.youtube.com/vi/xlElO06nQy8/hqdefault.jpg'; };
  }

  // Dynamic Island UI Sync
  updateDynamicIslandState();
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

  // Dynamic Island Sync
  updateDynamicIslandState();
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
  if (!state.isUserScrubbing) {
    const scrubber = document.getElementById('player-scrubber');
    if (scrubber) scrubber.value = progress || 0;
  }

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
  const trackList = playlists[state.currentPlaylistKey]?.tracks || [];
  if (trackList.length === 0) return;
  state.currentTrackIndex = (state.currentTrackIndex + 1) % trackList.length;
  const nextTrack = trackList[state.currentTrackIndex];
  updatePlayerUI(nextTrack);
  ytAudioPlayer.loadTrack(nextTrack, state.currentPlaylistKey, true);
  renderPlaylistTracks(state.activeTab);
}

function playPrevTrack() {
  const trackList = playlists[state.currentPlaylistKey]?.tracks || [];
  if (trackList.length === 0) return;
  state.currentTrackIndex = (state.currentTrackIndex - 1 + trackList.length) % trackList.length;
  const prevTrack = trackList[state.currentTrackIndex];
  updatePlayerUI(prevTrack);
  ytAudioPlayer.loadTrack(prevTrack, state.currentPlaylistKey, true);
  renderPlaylistTracks(state.activeTab);
}

function renderPlaylistTracks(playlistKey) {
  const container = document.getElementById('track-list-container');
  const descEl = document.getElementById('playlist-tab-desc');
  const pData = playlists[playlistKey];
  const lang = getLanguage();

  if (!pData || !container) return;

  if (descEl) descEl.textContent = pData.description;
  container.innerHTML = '';

  pData.tracks.forEach((track, index) => {
    const isCurrentPlaying = state.currentPlaylistKey === playlistKey && state.currentTrackIndex === index;
    const row = document.createElement('div');
    row.className = `track-row ${isCurrentPlaying ? 'active' : ''}`;
    row.setAttribute('data-track-index', index);

    const numLabel = formatNumber(index + 1 < 10 ? `0${index + 1}` : `${index + 1}`, lang);
    const rowTitle = lang === 'bn' ? (track.title_bn || track.title) : (track.title || track.title_bn);
    const rowArtist = `${track.artist || 'Traditional'}${track.composer ? ` • ${track.composer}` : ''}`;
    const rowCover = getTrackThumbnail(track);

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
      <img class="track-row-thumb" src="${rowCover}" alt="${rowTitle}" loading="lazy" onerror="this.onerror=null; this.src='https://img.youtube.com/vi/xlElO06nQy8/hqdefault.jpg';" />
      <div class="track-row-info">
        <div class="track-row-title">${rowTitle}</div>
        <div class="track-row-artist">${rowArtist}</div>
      </div>
      <span class="track-row-dur">${track.durationLabel || '3:30'}</span>
    `;

    row.addEventListener('click', () => {
      state.currentPlaylistKey = playlistKey;
      state.currentTrackIndex = index;
      updatePlayerUI(track);
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

;

let communityPhotos = [];
let photoLikes = {};
let currentLightboxIndex = 0;
let currentLightboxList = [];
let selectedUploadFiles = [];

function loadStoredGalleryData() {
  try {
    const rawPhotos = localStorage.getItem(STORAGE_KEYS.COMMUNITY_PHOTOS);
    communityPhotos = rawPhotos ? JSON.parse(rawPhotos) : [];
  } catch (e) {
    console.warn('Failed to load community photos from localStorage:', e);
    communityPhotos = [];
  }

  try {
    const rawLikes = localStorage.getItem(STORAGE_KEYS.PHOTO_LIKES);
    photoLikes = rawLikes ? JSON.parse(rawLikes) : {};
  } catch (e) {
    console.warn('Failed to load photo likes from localStorage:', e);
    photoLikes = {};
  }
}

function saveCommunityPhotos() {
  try {
    localStorage.setItem(STORAGE_KEYS.COMMUNITY_PHOTOS, JSON.stringify(communityPhotos));
  } catch (e) {
    console.warn('Failed to save community photos to localStorage:', e);
  }
}

function savePhotoLikes() {
  try {
    localStorage.setItem(STORAGE_KEYS.PHOTO_LIKES, JSON.stringify(photoLikes));
  } catch (e) {
    console.warn('Failed to save photo likes to localStorage:', e);
  }
}

function getPhotoLikeCount(photoId, defaultCount = 0) {
  if (photoLikes[photoId] !== undefined) {
    return photoLikes[photoId];
  }
  return defaultCount;
}

function incrementPhotoLike(photoId, defaultCount = 0) {
  const current = getPhotoLikeCount(photoId, defaultCount);
  photoLikes[photoId] = current + 1;
  savePhotoLikes();
  return photoLikes[photoId];
}

function getAllGalleryPhotos() {
  const nativeList = nativePujoData.gallery || [];
  return [...communityPhotos, ...nativeList];
}

function initPujoInfoAndGallery() {
  renderPujoModalContent();

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
    const lang = getLanguage();
    const shareText = lang === 'bn' 
      ? `পুজো আসছে! মন্ডল বাড়ির পুজো ২০২৬ (ফুরফুরা মণ্ডল পরিবার) • ১৯৯৭ সাল থেকে প্রতিষ্ঠিত ঐতিহ্য ও মিলনমেলা।
মহালয়া: ১০ অক্টোবর | মহাষ্টমী ও সন্ধিপূজা: ১৮ অক্টোবর ২০২৬
লাইভ কাউন্টডাউন ও আগমনী রেডিও: ${window.location.href}
Instagram: @furfura_mondal_poribar (${nativePujoData.instagramUrl})`
      : `Durga Puja 2026! Mondal Barir Pujo (Furfura Mondal Poribar) • Heritage since 1997.
Mahalaya: 10 October | Maha Ashtami & Sandhi Puja: 18 October 2026
Live Countdown & Festive Radio: ${window.location.href}
Instagram: @furfura_mondal_poribar (${nativePujoData.instagramUrl})`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: lang === 'bn' ? 'মন্ডল বাড়ির পুজো ২০২৬ — পুজো আসছে' : 'Mondal Barir Pujo 2026 — Festive Portal',
          text: shareText,
          url: window.location.href
        });
      } catch (e) {
        copyTextToClipboard(shareText, shareBtn, lang === 'bn' ? 'নিমন্ত্রণ লিংক কপি হয়েছে!' : 'Invitation link copied!');
      }
    } else {
      copyTextToClipboard(shareText, shareBtn, lang === 'bn' ? 'নিমন্ত্রণ লিংক কপি হয়েছে!' : 'Invitation link copied!');
    }
  });
}

function renderPujoModalContent() {
  const lang = getLanguage();
  // 1. Render 2026 Schedule Timeline in Modal
  const timelineContainer = document.getElementById('pujo-timeline-list');
  if (timelineContainer && nativePujoData.dates2026) {
    timelineContainer.innerHTML = '';
    nativePujoData.dates2026.forEach((item) => {
      const isSpecial = item.id === 'astami' || item.id === 'navami';
      const dayText = lang === 'bn' ? item.bengaliDay : (item.englishDay || item.bengaliDay);
      const ritualText = lang === 'bn' ? item.rituals : (item.englishRituals || item.rituals);
      const el = document.createElement('div');
      el.className = `timeline-item ${isSpecial ? 'highlight-item' : ''}`;
      el.innerHTML = `
        <div class="timeline-left">
          <span class="timeline-day">${dayText}</span>
          <span class="timeline-note">${ritualText}</span>
        </div>
        <span class="timeline-date">${item.date}</span>
      `;
      timelineContainer.appendChild(el);
    });
  }

  // 2. Render Heritage Highlights in Modal
  const highlightsContainer = document.getElementById('pujo-highlights-grid');
  if (highlightsContainer && nativePujoData.highlights) {
    highlightsContainer.innerHTML = '';
    nativePujoData.highlights.forEach((h) => {
      const titleText = lang === 'bn' ? h.title : (h.englishTitle || h.title);
      const descText = lang === 'bn' ? h.desc : (h.englishDesc || h.desc);
      const card = document.createElement('div');
      card.className = 'highlight-card';
      card.innerHTML = `
        <div class="highlight-card-title">${titleText}</div>
        <div class="highlight-card-desc">${descText}</div>
      `;
      highlightsContainer.appendChild(card);
    });
  }

  // 3. Render Modal Gallery Category Filter Tabs
  const catTabsContainer = document.getElementById('gallery-category-tabs');
  if (catTabsContainer && nativePujoData.galleryCategories) {
    catTabsContainer.innerHTML = '';
    nativePujoData.galleryCategories.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = `gallery-cat-btn ${cat.id === state.activeGalleryCategory ? 'active' : ''}`;
      btn.setAttribute('data-category', cat.id);
      btn.textContent = lang === 'bn' ? cat.label : (cat.englishLabel || cat.label);
      btn.addEventListener('click', () => {
        state.activeGalleryCategory = cat.id;
        document.querySelectorAll('.gallery-cat-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderModalGalleryItems();
      });
      catTabsContainer.appendChild(btn);
    });
  }

  // 4. Render Modal Gallery Items
  renderModalGalleryItems();
}

function renderModalGalleryItems() {
  const grid = document.getElementById('pujo-gallery-grid');
  if (!grid) return;
  const lang = getLanguage();

  grid.innerHTML = '';
  const allPhotos = getAllGalleryPhotos();
  const filtered = state.activeGalleryCategory === 'all'
    ? allPhotos
    : allPhotos.filter((g) => g.category === state.activeGalleryCategory);

  filtered.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'gallery-card';
    const title = lang === 'bn' ? (item.bengaliTitle || item.title) : (item.englishTitle || item.title || item.bengaliTitle);
    const category = lang === 'bn' ? (item.categoryLabel || item.category) : (item.categoryEnglish || item.categoryLabel || item.category);

    card.innerHTML = `
      <img class="gallery-img" src="${item.src}" alt="${title}" loading="lazy" />
      <div class="gallery-overlay">
        <span class="gallery-tag">${category}</span>
        <span class="gallery-title">${title}</span>
      </div>
    `;

    card.addEventListener('click', () => {
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
   PHOTO RIVER (দৃষ্টিসুখ — উৎসব ও স্মৃতিধারা) INFINITE SCROLLING SYSTEM
   ========================================================================== */

let flatRiverPhotos = [];

function initPhotoRiver() {
  flatRiverPhotos = [];
  if (photoRiverRows && Array.isArray(photoRiverRows)) {
    photoRiverRows.forEach((row) => {
      if (row.photos) {
        flatRiverPhotos.push(...row.photos);
      }
    });
  }

  photoRiverRows.forEach((row, rowIndex) => {
    const trackContent = document.getElementById(`river-track-content-${rowIndex + 1}`);
    if (!trackContent || !row.photos) return;

    trackContent.innerHTML = '';

    // To ensure seamless continuous infinite scrolling loop without blanks, duplicate cards
    const itemsToRender = [...row.photos, ...row.photos];

    itemsToRender.forEach((item) => {
      const card = createRiverCardElement(item);
      trackContent.appendChild(card);
    });
  });
}

function createRiverCardElement(item) {
  const card = document.createElement('div');
  card.className = 'river-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');

  const lang = getLanguage();
  const title = lang === 'bn' ? (item.bengaliTitle || item.title) : (item.englishTitle || item.title || item.bengaliTitle);
  const category = lang === 'bn' ? (item.categoryLabel || 'দর্শন') : (item.categoryEnglish || item.categoryLabel || 'Darshan');
  const pranamLabel = lang === 'bn' ? 'প্রণাম' : 'Pranam';
  card.setAttribute('aria-label', title);

  const likeCount = getPhotoLikeCount(item.id, item.likes || 18);

  card.innerHTML = `
    <img class="river-card-img" src="${item.src}" alt="${title}" loading="lazy" decoding="async" />
    <div class="river-card-overlay">
      <div class="river-card-top">
        <span class="river-category-pill">${category}</span>
      </div>
      <div class="river-card-bottom">
        <h4 class="river-card-title">${title}</h4>
        <span class="river-card-likes"><span class="like-val">${formatNumber(likeCount, lang)}</span> Like</span>
      </div>
    </div>
  `;

  card.addEventListener('click', () => {
    const foundIndex = flatRiverPhotos.findIndex((p) => p.id === item.id);
    const targetIdx = foundIndex !== -1 ? foundIndex : 0;
    openGalleryLightbox(targetIdx, flatRiverPhotos);
  });

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });

  return card;
}

/* ==========================================================================
   GRAND HERITAGE GALLERY SHOWCASE & INTERACTIVE COMMUNITY UPLOADS
   ========================================================================== */

function initGrandGallery() {
  loadStoredGalleryData();

  // 1. Scroll-To-Gallery & Jump-To-Top Smooth Navigation
  const scrollIndicator = document.getElementById('btn-scroll-to-gallery');
  scrollIndicator?.addEventListener('click', (e) => {
    e.preventDefault();
    smoothScrollToSection('photo-river-section', 620);
  });

  const jumpTopBtn = document.getElementById('btn-jump-top');
  jumpTopBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    smoothScrollToSection('hero-section', 620);
  });

  // Footer schedule button
  document.getElementById('btn-footer-open-schedule')?.addEventListener('click', () => {
    openModal('pujo-info-modal');
  });

  // 2. Category Filter Chips Bar
  const categoryChips = document.querySelectorAll('#gallery-main-category-chips .gallery-filter-chip');
  categoryChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const catId = chip.getAttribute('data-category');
      state.activeGalleryCategory = catId;
      categoryChips.forEach((c) => {
        const isSelected = c === chip;
        c.classList.toggle('active', isSelected);
        c.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      });
      renderGrandGalleryGrid();
    });
  });

  // 3. Upload Widget Toggle
  const toggleUploadBtn = document.getElementById('btn-toggle-upload');
  const uploadWidget = document.getElementById('photo-upload-widget');
  const closeUploadCard = document.getElementById('btn-close-upload-card');

  const setUploadWidgetVisibility = (show) => {
    if (uploadWidget) {
      uploadWidget.style.display = show ? 'block' : 'none';
      toggleUploadBtn?.setAttribute('aria-expanded', show ? 'true' : 'false');
    }
  };

  toggleUploadBtn?.addEventListener('click', () => {
    const isVisible = uploadWidget?.style.display === 'block';
    setUploadWidgetVisibility(!isVisible);
  });

  closeUploadCard?.addEventListener('click', () => {
    setUploadWidgetVisibility(false);
  });

  // 4. Drag & Drop and File Picker Handling
  const dropzone = document.getElementById('gallery-dropzone');
  const fileInput = document.getElementById('gallery-file-input');
  const browseBtn = document.getElementById('btn-browse-files');
  const previewsContainer = document.getElementById('dropzone-previews');
  const idleContent = document.getElementById('dropzone-idle-content');

  browseBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput?.click();
  });

  dropzone?.addEventListener('click', (e) => {
    if (!e.target.closest('.preview-remove-btn')) {
      fileInput?.click();
    }
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone?.addEventListener('drop', (e) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleSelectedFiles(files);
    }
  });

  fileInput?.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleSelectedFiles(files);
    }
  });

  function handleSelectedFiles(files) {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        selectedUploadFiles.push({
          dataUrl: event.target.result,
          name: file.name
        });
        updateDropzonePreviews();
      };
      reader.readAsDataURL(file);
    });
  }

  function updateDropzonePreviews() {
    if (!previewsContainer || !idleContent) return;
    if (selectedUploadFiles.length === 0) {
      previewsContainer.style.display = 'none';
      idleContent.style.display = 'flex';
      return;
    }

    idleContent.style.display = 'none';
    previewsContainer.style.display = 'flex';
    previewsContainer.innerHTML = '';

    selectedUploadFiles.forEach((item, index) => {
      const thumb = document.createElement('div');
      thumb.className = 'preview-thumb-card';
      thumb.innerHTML = `
        <img src="${item.dataUrl}" alt="Preview" />
        <button type="button" class="preview-remove-btn" data-index="${index}" title="মুছে ফেলুন">✕</button>
      `;

      thumb.querySelector('.preview-remove-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedUploadFiles.splice(index, 1);
        updateDropzonePreviews();
      });

      previewsContainer.appendChild(thumb);
    });
  }

  // 5. Submit Upload Button
  const submitUploadBtn = document.getElementById('btn-submit-photo-upload');
  const captionInput = document.getElementById('upload-caption-input');
  const authorInput = document.getElementById('upload-author-input');
  const categorySelect = document.getElementById('upload-category-select');
  const resetUploadBtn = document.getElementById('btn-clear-upload-form');

  const resetUploadForm = () => {
    selectedUploadFiles = [];
    if (fileInput) fileInput.value = '';
    if (captionInput) captionInput.value = '';
    if (authorInput) authorInput.value = '';
    if (categorySelect) categorySelect.value = 'community';
    updateDropzonePreviews();
  };

  resetUploadBtn?.addEventListener('click', resetUploadForm);

  submitUploadBtn?.addEventListener('click', () => {
    if (selectedUploadFiles.length === 0) {
      alert('অনুগ্রহ করে অন্তত একটি ছবি নির্বাচন করুন!');
      return;
    }

    const caption = captionInput?.value.trim() || 'মন্ডল বাড়ির পূজা স্মৃতি';
    const author = authorInput?.value.trim() || 'ভক্ত ও দর্শনার্থী';
    const category = categorySelect?.value || 'community';

    const categoryNames = {
      protima: 'প্রতিমা দর্শন',
      aarti: 'ধুনুচি ও আরতি',
      heritage: 'ঐতিহ্য ও পরিবার',
      sharat: 'শরতের আগমনী',
      community: 'ভক্তদের স্মৃতি'
    };

    selectedUploadFiles.forEach((fileObj) => {
      const newPhoto = {
        id: 'user-photo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        src: fileObj.dataUrl,
        title: caption,
        bengaliTitle: caption,
        bengaliDesc: `তোলা: ${author} • মন্ডল বাড়ির পুজো স্মৃতি`,
        category: category,
        categoryLabel: categoryNames[category] || 'ভক্তদের স্মৃতি',
        author: author,
        likes: 1,
        isCommunity: true,
        timestamp: Date.now()
      };
      communityPhotos.unshift(newPhoto);
    });

    saveCommunityPhotos();
    resetUploadForm();
    setUploadWidgetVisibility(false);
    renderGrandGalleryGrid(true);
    renderModalGalleryItems();
  });

  // Initial Grid Render & Lightbox Init
  renderGrandGalleryGrid();
  initGalleryLightbox();
}

function renderGrandGalleryGrid(isNewUpload = false) {
  const grid = document.getElementById('main-photo-gallery-grid');
  if (!grid) return;

  const lang = getLanguage();
  const allPhotos = getAllGalleryPhotos();

  // Update Category Badges Counts
  const counts = {
    all: allPhotos.length,
    protima: 0,
    aarti: 0,
    heritage: 0,
    sharat: 0,
    community: 0
  };

  allPhotos.forEach((photo) => {
    if (photo.category && counts[photo.category] !== undefined) {
      counts[photo.category]++;
    }
  });

  document.getElementById('count-cat-all') && (document.getElementById('count-cat-all').textContent = formatNumber(counts.all, lang));
  document.getElementById('count-cat-protima') && (document.getElementById('count-cat-protima').textContent = formatNumber(counts.protima, lang));
  document.getElementById('count-cat-aarti') && (document.getElementById('count-cat-aarti').textContent = formatNumber(counts.aarti, lang));
  document.getElementById('count-cat-heritage') && (document.getElementById('count-cat-heritage').textContent = formatNumber(counts.heritage, lang));
  document.getElementById('count-cat-sharat') && (document.getElementById('count-cat-sharat').textContent = formatNumber(counts.sharat, lang));
  document.getElementById('count-cat-community') && (document.getElementById('count-cat-community').textContent = formatNumber(counts.community, lang));

  // Filter List
  const filtered = state.activeGalleryCategory === 'all'
    ? allPhotos
    : allPhotos.filter((p) => p.category === state.activeGalleryCategory);

  currentLightboxList = filtered;
  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: rgba(255,255,255,0.7); font-family: var(--font-bengali-sans);">
        <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">${lang === 'bn' ? 'এই ক্যাটাগরিতে এখনও কোনো ছবি নেই।' : 'No photos available in this category yet.'}</p>
        <p style="font-size: 0.85rem; color: var(--heritage-gold);">${lang === 'bn' ? '"স্মৃতি ও ছবি জমা দিন" বাটনে ক্লিক করে আপনিই প্রথম ছবি যুক্ত করুন!' : 'Click "Add Memories / Upload" to add the first photograph!'}</p>
      </div>
    `;
    return;
  }

  filtered.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = `gallery-photo-card ${isNewUpload && index === 0 ? 'newly-added' : ''}`;
    
    const likeCount = getPhotoLikeCount(item.id, item.likes || 12);
    const isLiked = photoLikes[item.id] !== undefined;
    const title = lang === 'bn' ? (item.bengaliTitle || item.title) : (item.englishTitle || item.title || item.bengaliTitle);
    const desc = lang === 'bn' ? (item.bengaliDesc || item.title) : (item.englishDesc || item.description || item.title);
    const category = lang === 'bn' ? (item.categoryLabel || item.category) : (item.categoryEnglish || item.categoryLabel || item.category);
    const author = lang === 'bn' ? (item.author || 'মন্ডল পরিবার') : (item.authorEnglish || item.author || 'Mondal Family');
    const pranamLabel = lang === 'bn' ? 'প্রণাম' : 'Pranam';
    const communityLabel = lang === 'bn' ? 'ভক্তের ছবি' : 'Community';

    card.innerHTML = `
      <div class="gallery-card-img-wrap">
        <img class="gallery-card-img" src="${item.src}" alt="${title}" loading="lazy" decoding="async" />
        <span class="gallery-card-badge">${category}</span>
        ${item.isCommunity ? `<span class="gallery-card-community-badge">${communityLabel}</span>` : ''}
      </div>
      <div class="gallery-card-body">
        <h4 class="gallery-card-title">${title}</h4>
        <p class="gallery-card-desc">${desc}</p>
      </div>
      <div class="gallery-card-footer">
        <span class="gallery-card-author">${author}</span>
        <button type="button" class="gallery-like-btn ${isLiked ? 'liked' : ''}" data-photo-id="${item.id}" aria-label="Like Photo">
          <span class="btn-heart-wrapper">
            <svg class="empty" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
              <path fill="none" d="M0 0H24V24H0z"></path>
              <path d="M16.5 3C19.538 3 22 5.5 22 9c0 7-7.5 11-10 12.5C9.5 20 2 16 2 9c0-3.5 2.5-6 5.5-6C9.36 3 11 4 12 5c1-1 2.64-2 4.5-2zm-3.566 15.604c.881-.556 1.676-1.109 2.42-1.701C18.335 14.533 20 11.943 20 9c0-2.36-1.537-4-3.5-4-1.076 0-2.24.57-3.086 1.414L12 7.828l-1.414-1.414C9.74 5.57 8.576 5 7.5 5 5.56 5 4 6.656 4 9c0 2.944 1.666 5.533 4.645 7.903.745.592 1.54 1.145 2.421 1.7.299.189.595.37.934.572.339-.202.635-.383.934-.571z"></path>
            </svg>
            <svg class="filled" height="20" width="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0H24V24H0z" fill="none"></path>
              <path d="M16.5 3C19.538 3 22 5.5 22 9c0 7-7.5 11-10 12.5C9.5 20 2 16 2 9c0-3.5 2.5-6 5.5-6C9.36 3 11 4 12 5c1-1 2.64-2 4.5-2z"></path>
            </svg>
          </span>
          <span class="like-num">${formatNumber(likeCount, lang)}</span>
          <span class="like-label">Like</span>
        </button>
      </div>
    `;

    // Card click -> Opens Lightbox
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.gallery-like-btn')) {
        openGalleryLightbox(index, filtered);
      }
    });

    // Like button click
    const likeBtn = card.querySelector('.gallery-like-btn');
    likeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const updatedCount = incrementPhotoLike(item.id, item.likes || 12);
      likeBtn.classList.add('liked');
      const numEl = likeBtn.querySelector('.like-num');
      if (numEl) numEl.textContent = formatNumber(updatedCount, lang);
    });

    grid.appendChild(card);
  });
}

/* ==========================================================================
   OTHERS BY ONNOTA (অন্যান্য সৃষ্টি — অন্যতা) SHOWCASE SECTION
   ========================================================================== */

function initOnnotaSection() {
  updateOnnotaCategoryCounts();

  const chips = document.querySelectorAll('#onnota-category-chips .onnota-filter-chip');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const cat = chip.getAttribute('data-category');
      state.activeOnnotaCategory = cat;
      chips.forEach((c) => {
        const isMatch = c === chip;
        c.classList.toggle('active', isMatch);
        c.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });
      renderOnnotaGrid();
    });
  });

  renderOnnotaGrid();

  document.getElementById('btn-onnota-jump-top')?.addEventListener('click', (e) => {
    e.preventDefault();
    smoothScrollToSection('hero-section', 620);
  });

  document.getElementById('btn-onnota-open-schedule')?.addEventListener('click', () => {
    openModal('pujo-info-modal');
  });
}

function updateOnnotaCategoryCounts() {
  const lang = getLanguage();
  const counts = {
    all: onnotaCreations.length,
    art: 0,
    photography: 0,
    crafts: 0,
    literature: 0
  };

  onnotaCreations.forEach((item) => {
    if (item.category && counts[item.category] !== undefined) {
      counts[item.category]++;
    }
  });

  const countAll = document.getElementById('onnota-count-all');
  const countArt = document.getElementById('onnota-count-art');
  const countPhoto = document.getElementById('onnota-count-photography');
  const countCrafts = document.getElementById('onnota-count-crafts');
  const countLit = document.getElementById('onnota-count-literature');

  if (countAll) countAll.textContent = formatNumber(counts.all, lang);
  if (countArt) countArt.textContent = formatNumber(counts.art, lang);
  if (countPhoto) countPhoto.textContent = formatNumber(counts.photography, lang);
  if (countCrafts) countCrafts.textContent = formatNumber(counts.crafts, lang);
  if (countLit) countLit.textContent = formatNumber(counts.literature, lang);
}

function renderOnnotaGrid() {
  const grid = document.getElementById('onnota-cards-grid');
  if (!grid) return;

  const lang = getLanguage();
  const currentCat = state.activeOnnotaCategory || 'all';
  const filtered = currentCat === 'all'
    ? onnotaCreations
    : onnotaCreations.filter((item) => item.category === currentCat);

  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: rgba(255,255,255,0.7); font-family: var(--font-bengali-sans);">
        <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">${lang === 'bn' ? 'এই বিভাগে এখনও কোনো সৃষ্টি যুক্ত হয়নি।' : 'No creations available in this category yet.'}</p>
      </div>
    `;
    return;
  }

  filtered.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'onnota-card';
    card.setAttribute('role', 'article');
    card.setAttribute('tabindex', '0');

    const likeCount = getPhotoLikeCount(item.id, item.likes || 25);
    const isLiked = photoLikes[item.id] !== undefined;
    const title = lang === 'bn' ? (item.bengaliTitle || item.title) : (item.englishTitle || item.title || item.bengaliTitle);
    const desc = lang === 'bn' ? (item.desc_bn || item.desc_en || '') : (item.desc_en || item.desc_bn || '');
    const category = lang === 'bn' ? (item.categoryLabel || item.category) : (item.categoryEnglish || item.categoryLabel || item.category);
    const author = lang === 'bn' ? (item.author || 'অন্যতা') : (item.authorEnglish || item.author || 'Onnota');
    const date = lang === 'bn' ? (item.date || 'শরৎ ২০২৬') : (item.dateEnglish || 'Autumn 2026');
    const pranamLabel = lang === 'bn' ? 'প্রণাম' : 'Pranam';

    card.innerHTML = `
      <div class="onnota-card-img-wrap">
        <img class="onnota-card-img" src="${item.src}" alt="${title}" loading="lazy" decoding="async" />
        <span class="onnota-card-badge">${category}</span>
        ${item.tag ? `<span class="onnota-card-tag">${item.tag}</span>` : ''}
      </div>
      <div class="onnota-card-body">
        <h3 class="onnota-card-title">${title}</h3>
        <p class="onnota-card-desc">${desc}</p>
      </div>
      <div class="onnota-card-footer">
        <div class="onnota-card-meta">
          <span class="onnota-card-author">${author}</span>
          <span class="onnota-card-date">${date}</span>
        </div>
        <button type="button" class="onnota-like-btn ${isLiked ? 'liked' : ''}" data-item-id="${item.id}" aria-label="Give Pranam Blessing">
          <span class="btn-heart-wrapper">
            <svg class="empty" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
              <path fill="none" d="M0 0H24V24H0z"></path>
              <path d="M16.5 3C19.538 3 22 5.5 22 9c0 7-7.5 11-10 12.5C9.5 20 2 16 2 9c0-3.5 2.5-6 5.5-6C9.36 3 11 4 12 5c1-1 2.64-2 4.5-2zm-3.566 15.604c.881-.556 1.676-1.109 2.42-1.701C18.335 14.533 20 11.943 20 9c0-2.36-1.537-4-3.5-4-1.076 0-2.24.57-3.086 1.414L12 7.828l-1.414-1.414C9.74 5.57 8.576 5 7.5 5 5.56 5 4 6.656 4 9c0 2.944 1.666 5.533 4.645 7.903.745.592 1.54 1.145 2.421 1.7.299.189.595.37.934.572.339-.202.635-.383.934-.571z"></path>
            </svg>
            <svg class="filled" height="20" width="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0H24V24H0z" fill="none"></path>
              <path d="M16.5 3C19.538 3 22 5.5 22 9c0 7-7.5 11-10 12.5C9.5 20 2 16 2 9c0-3.5 2.5-6 5.5-6C9.36 3 11 4 12 5c1-1 2.64-2 4.5-2z"></path>
            </svg>
          </span>
          <span class="like-num">${formatNumber(likeCount, lang)}</span>
          <span class="like-label">Like</span>
        </button>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (!e.target.closest('.onnota-like-btn')) {
        openGalleryLightbox(index, filtered);
      }
    });

    card.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.onnota-like-btn')) {
        e.preventDefault();
        openGalleryLightbox(index, filtered);
      }
    });

    const likeBtn = card.querySelector('.onnota-like-btn');
    likeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const updatedCount = incrementPhotoLike(item.id, item.likes || 25);
      likeBtn.classList.add('liked');
      const numEl = likeBtn.querySelector('.like-num');
      if (numEl) numEl.textContent = formatNumber(updatedCount, lang);
    });

    grid.appendChild(card);
  });
}

function initGalleryLightbox() {

  // Fullscreen Lightbox close on backdrop click
  const lightboxModal = document.getElementById('gallery-lightbox-modal');
  lightboxModal?.addEventListener('click', (e) => {
    if (e.target === lightboxModal || e.target.classList.contains('gallery-lightbox-backdrop')) {
      closeModal('gallery-lightbox-modal');
    }
  });

  document.getElementById('btn-close-lightbox')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal('gallery-lightbox-modal');
  });

  const modal = document.getElementById('gallery-lightbox-modal');
  const closeBtn = document.getElementById('btn-close-lightbox');
  const prevBtn = document.getElementById('btn-lightbox-prev');
  const nextBtn = document.getElementById('btn-lightbox-next');
  const likeBtn = document.getElementById('btn-lightbox-like');
  const downloadBtn = document.getElementById('btn-lightbox-download');
  const shareBtn = document.getElementById('btn-lightbox-share');

  closeBtn?.addEventListener('click', () => {
    closeModal('gallery-lightbox-modal');
  });

  prevBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentLightboxList.length === 0) return;
    currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxList.length) % currentLightboxList.length;
    updateLightboxUI();
  });

  nextBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentLightboxList.length === 0) return;
    currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxList.length;
    updateLightboxUI();
  });

  likeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const item = currentLightboxList[currentLightboxIndex];
    if (!item) return;
    incrementPhotoLike(item.id, item.likes || 12);
    updateLightboxUI();
    renderGrandGalleryGrid();
    renderOnnotaGrid();
    initPhotoRiver();
  });

  downloadBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const item = currentLightboxList[currentLightboxIndex];
    if (!item) return;
    const a = document.createElement('a');
    a.href = item.src;
    a.download = `mondal-barir-pujo-${item.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  shareBtn?.addEventListener('click', async (e) => {
    e.stopPropagation();
    const item = currentLightboxList[currentLightboxIndex];
    if (!item) return;

    const lang = getLanguage();
    const shareTitle = lang === 'bn' ? (item.bengaliTitle || item.title) : (item.englishTitle || item.title || item.bengaliTitle);
    const shareText = lang === 'bn' 
      ? `মন্ডল বাড়ির পুজো ২০২৬ (১৯৯৭ সাল থেকে প্রতিষ্ঠিত ঐতিহ্য): "${shareTitle}"
@furfura_mondal_poribar • লাইভ ফটো গ্যালারি ও আগমনী রেডিও: ${window.location.href}`
      : `Mondal Barir Pujo 2026 (Heritage since 1997): "${shareTitle}"
@furfura_mondal_poribar • Live Photo Gallery & Festive Radio: ${window.location.href}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: window.location.href
        });
      } catch (err) {
        copyTextToClipboard(shareText, shareBtn, lang === 'bn' ? 'নিমন্ত্রণ লিংক কপি হয়েছে!' : 'Link copied!');
      }
    } else {
      copyTextToClipboard(shareText, shareBtn, lang === 'bn' ? 'নিমন্ত্রণ লিংক কপি হয়েছে!' : 'Link copied!');
    }
  });

  // Keyboard navigation for Lightbox
  document.addEventListener('keydown', (e) => {
    if (modal?.classList.contains('active')) {
      if (e.key === 'ArrowLeft') {
        prevBtn?.click();
      } else if (e.key === 'ArrowRight') {
        nextBtn?.click();
      } else if (e.key === 'Escape') {
        closeModal('gallery-lightbox-modal');
      }
    }
  });
}

function openGalleryLightbox(index, customList = null) {
  if (customList && customList.length > 0) {
    currentLightboxList = customList;
  } else {
    currentLightboxList = getAllGalleryPhotos();
  }
  if (!currentLightboxList || currentLightboxList.length === 0) return;
  currentLightboxIndex = Math.max(0, Math.min(index, currentLightboxList.length - 1));
  updateLightboxUI();
  openModal('gallery-lightbox-modal');
}

function updateLightboxUI() {
  const item = currentLightboxList[currentLightboxIndex];
  if (!item) return;

  const lang = getLanguage();
  const imgEl = document.getElementById('lightbox-img');
  const catEl = document.getElementById('lightbox-category-badge');
  const authorEl = document.getElementById('lightbox-author-badge');
  const counterEl = document.getElementById('lightbox-counter-badge');
  const titleEl = document.getElementById('lightbox-title');
  const descEl = document.getElementById('lightbox-desc');
  const likeCountEl = document.getElementById('lightbox-like-count');

  const title = lang === 'bn' ? (item.bengaliTitle || item.title) : (item.englishTitle || item.title || item.bengaliTitle);
  const desc = lang === 'bn' ? (item.bengaliDesc || item.desc_bn || item.desc || item.title) : (item.englishDesc || item.desc_en || item.description || item.desc || item.title);
  const category = lang === 'bn' ? (item.categoryLabel || item.category) : (item.categoryEnglish || item.categoryLabel || item.category);
  const author = lang === 'bn' ? (item.author || 'মন্ডল পরিবার') : (item.authorEnglish || item.author || 'Mondal Family');
  const date = lang === 'bn' ? (item.date || '') : (item.dateEnglish || item.date || '');

  if (imgEl) {
    imgEl.src = item.src;
    imgEl.alt = title;
  }
  if (catEl) catEl.textContent = category;
  if (authorEl) authorEl.textContent = `${author}${date ? ` • ${date}` : ''}`;
  if (counterEl) counterEl.textContent = `${formatNumber(currentLightboxIndex + 1, lang)} / ${formatNumber(currentLightboxList.length, lang)}`;
  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = desc;

  const count = getPhotoLikeCount(item.id, item.likes || 12);
  if (likeCountEl) likeCountEl.textContent = formatNumber(count, lang);
  const isLiked = photoLikes[item.id] !== undefined;
  const lbLikeBtn = document.getElementById('btn-lightbox-like');
  if (lbLikeBtn) {
    if (isLiked) lbLikeBtn.classList.add('liked');
    else lbLikeBtn.classList.remove('liked');
  }
}

/* ==========================================================================
   6. INSTAGRAM STORY & SHARE CARD GENERATOR
   ========================================================================== */

function initStoryGenerator() {

  // All Story Generator triggers
  const storyTriggers = [
    'btn-open-story-gen',
    'btn-trig-story-gen',
    'mobile-nav-story',
    'btn-modal-open-story',
    'island-quick-story'
  ];

  storyTriggers.forEach((id) => {
    document.getElementById(id)?.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('story-generator-modal');
      renderStoryCanvas();
    });
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

    const shareText = `পুজো আসছে! মন্ডল বাড়ির পুজো ২০২৬ (Furfura Mondal Poribar) • ১৯৯৭ সাল থেকে প্রতিষ্ঠিত ঐতিহ্য। Follow @furfura_mondal_poribar ${nativePujoData.instagramUrl}`;

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
          copyTextToClipboard(shareText, shareBtn, 'লিংক ও ক্যাপশন কপি হয়েছে!');
        }
      });
    } else {
      copyTextToClipboard(shareText, shareBtn, 'লিংক ও ক্যাপশন কপি হয়েছে!');
    }
  });

  // Copy Caption & Hashtags
  document.getElementById('btn-copy-story-caption')?.addEventListener('click', () => {
    const copyBtn = document.getElementById('btn-copy-story-caption');
    const cd = getCountdown();
    const caption = `মা আসছেন ঘরে! 

মন্ডল বাড়ির পুজো ২০২৬ (Furfura Mondal Poribar Pujo)
নাটমন্দির, ফুরফুরা, হুগলী, পশ্চিমবঙ্গ
আর মাত্র ${cd.days} দিন বাকি (Maha Shasthi: 16 Oct 2026)

১৯৯৭ সাল থেকে প্রতিষ্ঠিত ঐতিহ্য, সাবেকি একচালা ডাকের সাজ, ১০৮ পদ্মে সন্ধিপূজা ও ধুনুচি নাচ।
আগমনী রেডিও ও লাইভ কাউন্টডাউন দেখুন: ${window.location.href}

Follow on Instagram: @furfura_mondal_poribar
${nativePujoData.instagramUrl}
#FurfuraMondalPoribar #MondalBarirPujo #মন্ডলবাড়িরপুজো #DurgaPuja2026 #PujoAsche #MondalBariRadio #Agomoni #KolkataDurgaPuja #BonediBariPujo #Dankuni #Hooghly`;

    copyTextToClipboard(caption, copyBtn, 'সম্পূর্ণ ক্যাপশন ও হ্যাশট্যাগ কপি হয়েছে!');
  });
}

function renderStoryCanvas() {
  const canvas = document.getElementById('story-card-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;  // 1080
  const height = canvas.height; // 1920

  const lang = getLanguage();
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

  // 5. Header Badge: "মন্ডল বাড়ির পুজো • ১৯৯৭ থেকে প্রতিষ্ঠিত ঐতিহ্য"
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  roundRect(ctx, width / 2 - 310, 100, 620, 60, 30);
  ctx.fill();
  ctx.strokeStyle = currentTheme.gold;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 24px "Noto Sans Bengali", "Poppins", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(lang === 'bn' ? 'মন্ডল বাড়ির পুজো • ১৯৯৭ থেকে প্রতিষ্ঠিত ঐতিহ্য' : 'Mondal Barir Pujo • Heritage Since 1997', width / 2, 138);
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

  // Sacred Third Eye (ত্রিনয়ন) / Shloka
  ctx.fillStyle = currentTheme.gold;
  ctx.font = '700 44px "Noto Sans Bengali", "Cinzel Decorative", serif';
  ctx.textAlign = 'center';
  ctx.fillText(lang === 'bn' ? '॥ শ্রীশ্রীদুর্গোৎসব ॥' : '॥ SRI SRI DURGOTSAV ॥', centerX, centerY + 20);

  // Subtitle Sacred Shloka
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '500 28px "Noto Sans Bengali", "Poppins", sans-serif';
  ctx.fillText(lang === 'bn' ? 'যা দেবী সর্বভূতেষু মাতৃরূপেণ সংস্থিতা' : 'Ya Devi Sarva Bhuteshu Matri Rupena Samsthita', centerX, centerY + 90);
  ctx.restore();

  // 7. Bengali / English Display Headline
  ctx.save();
  ctx.textAlign = 'center';

  const headlinesMap = {
    'pujo-asche': lang === 'bn' 
      ? { top: 'পুজো', bot: 'আসছে', full: 'মন্ডল বাড়ির পুজো ২০২৬' }
      : { top: 'PUJO', bot: 'ASCHE', full: 'Mondal Barir Pujo 2026' },
    'subho-saradiya': lang === 'bn'
      ? { top: 'শুভ', bot: 'শারদীয়া', full: 'মন্ডল বাড়ির দুর্গাপূজা' }
      : { top: 'SUBHO', bot: 'SARADIYA', full: 'Mondal Bari Durga Puja' },
    'maa-aschen': lang === 'bn'
      ? { top: 'মা আসছেন', bot: 'ঘরে', full: '১৯৯৭ থেকে প্রতিষ্ঠিত ঐতিহ্য ও আনন্দ' }
      : { top: 'MAA', bot: 'ASCHEN', full: 'Heritage & Celebrations Since 1997' },
    'sandhi-puja': lang === 'bn'
      ? { top: '১০৮ পদ্মে', bot: 'সন্ধিপূজা', full: 'মহামিলনোৎসবে সপরিবারে আমন্ত্রণ' }
      : { top: '108 DIYAS', bot: 'SANDHI PUJA', full: 'Warm Welcome with Family & Friends' }
  };

  const selectedHead = headlinesMap[state.storyGen.headline] || headlinesMap['pujo-asche'];

  // Dual Line Main Calligraphy
  ctx.fillStyle = currentTheme.gold;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 24;
  ctx.font = '900 130px "Galada", "Cinzel Decorative", "Noto Sans Bengali", cursive';
  ctx.fillText(selectedHead.top, centerX, 760);
  ctx.fillText(selectedHead.bot, centerX, 910);
  ctx.shadowBlur = 0;

  // Sub headline
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 36px "Hind Siliguri", "Noto Sans Bengali", "Poppins", sans-serif';
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
    ctx.fillText(`${formatNumber(cd.days, lang)} ${lang === 'bn' ? 'দিন বাকি' : 'DAYS TO GO'}`, centerX, countBoxY + 62);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '500 26px "Noto Sans Bengali", "Poppins", sans-serif';
    ctx.fillText(lang === 'bn' ? 'মহা ষষ্ঠী: ১৬ অক্টোবর ২০২৬ (শুক্রবার)' : 'Maha Sasthi: 16 October 2026 (Friday)', centerX, countBoxY + 104);
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
    ctx.font = '700 24px "Noto Sans Bengali", "Poppins", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(lang === 'bn' ? 'পূজার নির্ঘণ্ট ২০২৬' : 'Durga Puja 2026 Schedule', centerX, schedBoxY + 45);

    const scheduleLines = lang === 'bn' ? [
      { day: 'মহালয়া', date: '১০ অক্টোবর (ভোর ৪:৩০ চণ্ডীপাঠ)' },
      { day: 'মহা ষষ্ঠী', date: '১৬ অক্টোবর (বোধন ও আমন্ত্রণ)' },
      { day: 'মহা সপ্তমী', date: '১৭ অক্টোবর (নবপত্রিকা প্রবেশ)' },
      { day: 'মহা অষ্টমী', date: '১৮ অক্টোবর (১০৮ পদ্ম ও প্রদীপে সন্ধিপূজা)' },
      { day: 'মহা নবমী', date: '১৯ অক্টোবর (মহাপ্রসাদ ও ধুনুচি নাচ)' },
      { day: 'বিজয়া দশমী', date: '২০ অক্টোবর (সিঁদুর খেলা ও শান্তিজল)' }
    ] : [
      { day: 'Mahalaya', date: '10 October (4:30 AM Chandi Path)' },
      { day: 'Maha Sasthi', date: '16 October (Bodhon & Welcome)' },
      { day: 'Maha Saptami', date: '17 October (Nabapatrika Pravesh)' },
      { day: 'Maha Ashtami', date: '18 October (108 Lotuses Sandhi Puja)' },
      { day: 'Maha Navami', date: '19 October (Mahaprasad & Dhunuchi)' },
      { day: 'Bijoya Dashami', date: '20 October (Sindoor Khela & Blessings)' }
    ];

    ctx.font = '500 21px "Noto Sans Bengali", "Poppins", sans-serif';
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
    ctx.fillText('@furfura_mondal_poribar', centerX, handleY + 6);
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
          if (playText) playText.textContent = lang === 'bn' ? 'বোল বন্ধ করুন' : 'Stop Bol';
        } else {
          playBtn?.classList.remove('loop-active');
          if (playIcon) playIcon.textContent = '▶';
          if (playText) playText.textContent = lang === 'bn' ? 'বোল বাজানো শুরু করুন' : 'Play Bol';
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
      openModal('playlists-modal');
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

// Universal Click Delegation for all Interactive Modals and Section Links (Ponytail Engine)
document.addEventListener('click', (e) => {
  const target = e.target;
  if (!target) return;

  // 1. Story Generator triggers
  if (target.closest('#btn-trig-story-gen, #island-quick-story, #mobile-nav-story, #btn-modal-open-story, .story-launch-modal-btn')) {
    e.preventDefault();
    openModal('story-generator-modal');
    return;
  }

  // 2. Puja Schedule & Rituals triggers
  if (target.closest('#btn-footer-open-schedule, #btn-onnota-open-schedule, .countdown-footer-badge, #countdown-sub-label, #btn-open-pujo-info, #mobile-nav-pujo, .btn-footer-schedule')) {
    e.preventDefault();
    openModal('pujo-info-modal');
    return;
  }

  // 3. Playlists & Festive Radio triggers
  if (target.closest('#btn-open-playlists, #island-quick-radio, #mobile-nav-radio, #player-art-btn, #mobile-media-pill-btn')) {
    e.preventDefault();
    openModal('playlists-modal');
    return;
  }

  // 4. Modal Close buttons
  if (target.closest('.close-btn, .lightbox-close-btn, #btn-close-lightbox, [data-close-modal]')) {
    e.preventDefault();
    e.stopPropagation();
    const modal = target.closest('.modal-backdrop, .gallery-lightbox-backdrop') || document.getElementById('gallery-lightbox-modal');
    if (modal) {
      modal.classList.remove('active');
    }
    closeModal('gallery-lightbox-modal');
    closeAllModals();
    document.body.style.overflow = '';
    return;
  }
});


  // Wire all Puja Schedule & Rituals triggers across the platform
  const scheduleButtons = [
    'btn-footer-open-schedule',
    'btn-onnota-open-schedule',
    'countdown-sub-label',
    'btn-open-pujo-info',
    'mobile-nav-pujo'
  ];

  scheduleButtons.forEach((btnId) => {
    document.getElementById(btnId)?.addEventListener('click', (e) => {
      e.preventDefault();
      renderPujoModalContent();
      openModal('pujo-info-modal');
    });
  });

  document.querySelectorAll('.btn-footer-schedule, .countdown-footer-badge').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      renderPujoModalContent();
      openModal('pujo-info-modal');
    });
  });

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
    if (playText) playText.textContent = lang === 'bn' ? 'বোল বাজানো শুরু করুন' : 'Play Bol';
    document.querySelectorAll('.step-tile').forEach((t) => t.classList.remove('active-step'));
    if (activeStepLabel) activeStepLabel.textContent = lang === 'bn' ? 'মাত্রা: -- / ১৬' : 'Step: -- / 16';
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
  if (!el) return;

  if (modalId === 'pujo-info-modal' && typeof renderPujoModalContent === 'function') {
    renderPujoModalContent();
  }
  if (modalId === 'story-generator-modal' && typeof renderStoryCanvas === 'function') {
    renderStoryCanvas();
  }

  el.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove('active');

  const anyActive = document.querySelector('.modal-backdrop.active, #welcome-modal-overlay:not(.hidden)');
  if (!anyActive) {
    document.body.style.overflow = '';
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach((b) => b.classList.remove('active'));
  audioEngine.stopAll();
}

function initWelcomeModal() {
  const welcomeOverlay = document.getElementById('welcome-modal-overlay');
  if (!welcomeOverlay) return;

  const langBnBtn = document.getElementById('welcome-lang-bn');
  const langEnBtn = document.getElementById('welcome-lang-en');
  const soundYesBtn = document.getElementById('welcome-sound-yes');
  const soundNoBtn = document.getElementById('welcome-sound-no');
  const enterBtn = document.getElementById('btn-welcome-enter');

  let selectedLang = getLanguage() || 'bn';
  let selectedSound = 'yes';

  // Sync initial state of welcome modal buttons to current language
  const syncWelcomeLangButtons = (lang) => {
    selectedLang = lang;
    const allWelcomeLangBtns = welcomeOverlay.querySelectorAll('.welcome-choice-lang-btn, .welcome-choice-btn[data-lang], #welcome-lang-bn, #welcome-lang-en');
    allWelcomeLangBtns.forEach((btn) => {
      const btnLang = btn.getAttribute('data-lang');
      const isActive = btnLang === lang;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  };

  syncWelcomeLangButtons(selectedLang);

  // Language choice buttons
  const handleLangChoice = (lang) => {
    selectedLang = lang;
    state.lang = lang;
    setLanguage(lang);
    syncWelcomeLangButtons(lang);
  };

  // Bind click/touch on welcome language buttons
  welcomeOverlay.querySelectorAll('.welcome-choice-lang-btn, .welcome-choice-btn[data-lang], #welcome-lang-bn, #welcome-lang-en').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const lang = btn.getAttribute('data-lang');
      if (lang) handleLangChoice(lang);
    });
  });

  // Sound choice buttons
  const updateSoundChoices = (sound) => {
    selectedSound = sound;
    soundYesBtn?.classList.toggle('active', sound === 'yes');
    soundYesBtn?.setAttribute('aria-pressed', sound === 'yes' ? 'true' : 'false');
    soundNoBtn?.classList.toggle('active', sound === 'no');
    soundNoBtn?.setAttribute('aria-pressed', sound === 'no' ? 'true' : 'false');
  };

  soundYesBtn?.addEventListener('click', () => updateSoundChoices('yes'));
  soundNoBtn?.addEventListener('click', () => updateSoundChoices('no'));

  // Enter Site Action
  const handleEnterSite = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    try {
      // 1. Save and apply chosen language
      state.lang = selectedLang;
      setLanguage(selectedLang);

                  // 2. Handle audio based on user choice
      if (selectedSound === 'yes') {
        state.soundEnabled = true;
        state.isAudioPlaying = true;
        updatePlayPauseButton(true);
        updateArtVinylAnimation(true);
        updateEqualizerAnimation();
        updateDynamicIslandState();

        ytAudioPlayer.setMute(false);
        ytAudioPlayer.setVolume(85);
        if (typeof audioEngine.resumeAudioContext === 'function') {
          audioEngine.resumeAudioContext();
        }

        const track = getCurrentTrack();
        ytAudioPlayer.loadTrack(track, state.currentPlaylistKey, true);
      } else {
        state.soundEnabled = false;
        state.isAudioPlaying = false;
        updatePlayPauseButton(false);
        updateArtVinylAnimation(false);
        updateEqualizerAnimation();
        updateDynamicIslandState();

        if (typeof ytAudioPlayer.pause === 'function') {
          ytAudioPlayer.pause();
        }
      }
    } catch (err) {
      console.warn('Audio preference init notice on enter:', err);
    } finally {
      // 3. Always Animate away modal and safely unlock view
      if (welcomeOverlay) {
        welcomeOverlay.classList.add('hidden');
        setTimeout(() => {
          welcomeOverlay.remove();
        }, 400);
      }

      // 4. Always ensure viewport starts at the top of Hero section
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      const heroEl = document.getElementById('hero-section');
      if (heroEl) {
        heroEl.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    }
  };

  enterBtn?.addEventListener('click', handleEnterSite);
  enterBtn?.addEventListener('touchend', (e) => {
    // Prevent double firing on fast mobile tap
    if (!welcomeOverlay.classList.contains('hidden')) {
      handleEnterSite(e);
    }
  });
}

function initLanguageSwitcher() {
  const syncAllLanguageUI = (lang) => {
    state.lang = lang;

    // 1. Desktop & Dynamic Island header labels
    const desktopLabel = document.getElementById('lang-current-label');
    if (desktopLabel) {
      desktopLabel.textContent = lang === 'bn' ? 'বাংলা' : 'English';
    }

    const activeLabel = document.getElementById('lang-active-label');
    if (activeLabel) {
      activeLabel.textContent = lang === 'bn' ? 'বাংলা • EN' : 'EN • বাং';
    }

    const activeToggle = document.getElementById('btn-toggle-lang-active');
    if (activeToggle) {
      activeToggle.setAttribute('aria-label', `Change Language (Current: ${lang === 'bn' ? 'বাংলা' : 'English'})`);
    }

    const mainToggle = document.getElementById('btn-toggle-lang');
    if (mainToggle) {
      mainToggle.setAttribute('aria-label', `Toggle Language (Current: ${lang === 'bn' ? 'বাংলা' : 'English'})`);
    }

    // 2. Dynamic Island language chips
    document.querySelectorAll('.island-lang-section .island-vibe-chip[data-lang], #island-lang-bn, #island-lang-en').forEach((chip) => {
      const chipLang = chip.getAttribute('data-lang');
      const isActive = chipLang === lang;
      chip.classList.toggle('active', isActive);
      chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    // 3. Welcome modal language buttons
    document.querySelectorAll('.welcome-choice-lang-btn, .welcome-choice-btn[data-lang], #welcome-lang-bn, #welcome-lang-en').forEach((btn) => {
      const btnLang = btn.getAttribute('data-lang');
      const isActive = btnLang === lang;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    // 4. Header buttons & aliases (#header-lang-btn, #lang-switch-btn, .header-lang-btn, .lang-switch-btn, [data-lang-btn])
    document.querySelectorAll('#header-lang-btn, #lang-switch-btn, .header-lang-btn, .lang-switch-btn, [data-lang-btn]').forEach((btn) => {
      const btnLang = btn.getAttribute('data-lang');
      if (btnLang) {
        const isActive = btnLang === lang;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      } else {
        const labelEl = btn.querySelector('.lang-btn-label, .btn-label, span');
        if (labelEl) {
          labelEl.textContent = lang === 'bn' ? 'বাংলা' : 'English';
        }
        btn.setAttribute('aria-label', `Change Language (Current: ${lang === 'bn' ? 'বাংলা' : 'English'})`);
      }
    });

    // 5. Update Attendance text if rendered
    const attendanceBtn = document.getElementById('btn-confirm-attendance');
    const attendanceText = document.getElementById('attendance-btn-text');
    if (attendanceBtn && attendanceText) {
      const isConfirmed = attendanceBtn.classList.contains('confirmed');
      attendanceText.textContent = isConfirmed
        ? (t('invitation_confirmed') || 'প্রণাম ও শুভেচ্ছা গৃহীত হয়েছে')
        : (t('invitation_confirm') || 'প্রণাম ও শারদ শুভেচ্ছা');
    }
  };

  const toggleLanguage = () => {
    const nextLang = getLanguage() === 'bn' ? 'en' : 'bn';
    state.lang = nextLang;
    setLanguage(nextLang);
    syncAllLanguageUI(nextLang);
  };

  const selectLanguage = (lang) => {
    state.lang = lang;
    setLanguage(lang);
    syncAllLanguageUI(lang);
  };

  // Dynamic Island / Header Toggles
  document.getElementById('btn-toggle-lang')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLanguage();
  });

  document.getElementById('btn-toggle-lang-active')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLanguage();
  });

  // Header language button aliases
  document.getElementById('header-lang-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLanguage();
  });

  document.getElementById('lang-switch-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLanguage();
  });

  document.querySelectorAll('.header-lang-btn, .lang-switch-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetLang = btn.getAttribute('data-lang');
      if (targetLang) {
        selectLanguage(targetLang);
      } else {
        toggleLanguage();
      }
    });
  });

  // Dynamic Island Language Chips
  document.getElementById('island-lang-bn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    selectLanguage('bn');
  });

  document.getElementById('island-lang-en')?.addEventListener('click', (e) => {
    e.stopPropagation();
    selectLanguage('en');
  });

  // Generic data-lang chips / buttons
  document.querySelectorAll('.island-vibe-chips [data-lang], [data-lang-btn]').forEach((chip) => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const lang = chip.getAttribute('data-lang');
      if (lang) selectLanguage(lang);
    });
  });

  // Listen to global language change event
  window.addEventListener('pujo_language_changed', (e) => {
    const lang = e.detail?.lang || getLanguage();
    syncAllLanguageUI(lang);
    
    // Refresh all dynamic views & components
    if (typeof updateAtmosphere === 'function') {
      updateAtmosphere();
    }
    if (typeof updateDynamicIslandState === 'function') {
      updateDynamicIslandState();
    }
    if (typeof renderPlaylistTracks === 'function') {
      renderPlaylistTracks(state.activeTab);
    }
    if (typeof updatePlayerUI === 'function') {
      updatePlayerUI(getCurrentTrack());
    }
    if (typeof renderLiveDhakParts === 'function') {
      renderLiveDhakParts();
    }
    if (typeof updateLiveDhakBanner === 'function') {
      updateLiveDhakBanner(authenticLiveDhakParts[state.currentLiveDhakIndex]);
    }
    if (typeof updateLiveDhakPlayState === 'function') {
      updateLiveDhakPlayState(state.isLiveDhakPlaying);
    }
    if (typeof renderPujoModalContent === 'function') {
      renderPujoModalContent();
    }
    if (typeof initPhotoRiver === 'function') {
      initPhotoRiver();
    }
    if (typeof renderGrandGalleryGrid === 'function') {
      renderGrandGalleryGrid();
    }
    if (typeof updateOnnotaCategoryCounts === 'function') {
      updateOnnotaCategoryCounts();
    }
    if (typeof renderOnnotaGrid === 'function') {
      renderOnnotaGrid();
    }
    if (typeof updateLightboxUI === 'function') {
      updateLightboxUI();
    }
    if (typeof renderStoryCanvas === 'function') {
      renderStoryCanvas();
    }
  });

  // Initial Sync
  syncAllLanguageUI(getLanguage());
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

/* ==========================================================================
   8.5. FORMAL INVITATION SECTION CONTROLLER
   ========================================================================== */

function initInvitationSection() {
  const imageViewer = document.getElementById('invitation-image-viewer');
  const shareBtn = document.getElementById('btn-share-invitation');
  const attendanceBtn = document.getElementById('btn-confirm-attendance');
  const attendanceText = document.getElementById('attendance-btn-text');

  // 1. Fullscreen Lightbox View on Image / Card Click
  imageViewer?.addEventListener('click', () => {
    const invitationItem = {
      id: 'formal-invitation-letterhead',
      src: '/invitation/invitation.jpg',
      title: 'শ্রীশ্রী দুর্গাপূজার সানন্দ আমন্ত্রণলিপি',
      bengaliTitle: 'শ্রীশ্রী দুর্গাপূজার সানন্দ আমন্ত্রণ — ফুরফুরা মণ্ডল পরিবার',
      categoryLabel: 'সানন্দ আমন্ত্রণপত্র',
      author: 'ফুরফুরা মণ্ডল পরিবার, ফুরফুরা, কাজীপাড়া, হুগলী',
      bengaliDesc: 'সমাগত দুর্গাপূজায় আমাদের ফুরফুরাস্থিত দুর্গাপূজা মণ্ডপে সকল মাতৃভক্ত ও সুধীজনকে সবান্ধব উপস্থিত হয়ে মাতৃপূজা বেদীতে পুষ্পাঞ্জলি ও অর্ঘ্য নিবেদনের সানন্দ আহ্বান জানাই। সপ্তমী সন্ধ্যায় বিচিত্রানুষ্ঠান ও নবমী সন্ধ্যায় ঐতিহ্যবাহী ধুনুচি নাচ ও ঢাকের লড়াই।',
      likes: 540
    };

    if (typeof openGalleryLightbox === 'function') {
      openGalleryLightbox(0, [invitationItem]);
    }
  });

  // 2. Share Invitation via WhatsApp / Web Share API
  shareBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    const shareText = `শ্রীশ্রী দুর্গাপূজার সানন্দ আমন্ত্রণ

ফুরফুরা মণ্ডল পরিবার (ফুরফুরা, কাজীপাড়া, হুগলী)
১৯৯৭ সাল থেকে অনুষ্ঠিত সাবেকি শারদোৎসব ২০২৬

সুধী,
সমাগত দুর্গাপূজায় আমাদের ফুরফুরাস্থিত দুর্গাপূজা মণ্ডপে সকল মাতৃভক্ত ও সুধীজনকে সবান্ধব উপস্থিত হয়ে মাতৃপূজা বেদীতে পুষ্পাঞ্জলি ও অর্ঘ্য নিবেদনের সানন্দ আহ্বান জানাই।

মহা সপ্তমী সন্ধ্যা: বিচিত্রানুষ্ঠান ও আনন্দমেলা
মহা নবমী সন্ধ্যা: নাটমন্দিরে ঐতিহ্যবাহী ধুনুচি নাচ ও সাবেকি ঢাকের লড়াই

পূজামণ্ডপ অবস্থান ও দিকনির্দেশনা: https://maps.app.goo.gl/YXcU7gT92CLx1XkbA
ডিজিটাল আমন্ত্রণপত্র ও লাইভ আগমনী রেডিও: ${window.location.href}
Instagram: @furfura_mondal_poribar`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'শ্রীশ্রী দুর্গাপূজার সানন্দ আমন্ত্রণ — ফুরফুরা মণ্ডল পরিবার',
          text: shareText,
          url: window.location.href
        });
        return;
      } catch (_) {}
    }

    if (typeof copyTextToClipboard === 'function') {
      copyTextToClipboard(shareText, shareBtn, 'নিমন্ত্রণবার্তা কপি হয়েছে!');
    }
  });

  // 3. Confirm Attendance / Blessing Counter
  const savedAttendance = localStorage.getItem('mondal_bari_invite_confirmed');
  if (savedAttendance === 'true' && attendanceBtn && attendanceText) {
    attendanceBtn.classList.add('confirmed');
    attendanceText.textContent = t('invitation_confirmed') || 'প্রণাম ও শুভেচ্ছা গৃহীত হয়েছে';
  }

  attendanceBtn?.addEventListener('click', () => {
    const isConfirmed = attendanceBtn.classList.contains('confirmed');
    if (!isConfirmed) {
      attendanceBtn.classList.add('confirmed');
      localStorage.setItem('mondal_bari_invite_confirmed', 'true');
      if (attendanceText) {
        attendanceText.textContent = t('invitation_confirmed') || 'প্রণাম ও শুভেচ্ছা গৃহীত হয়েছে';
      }
      if (typeof audioEngine?.playDiyaLight === 'function') {
        audioEngine.playDiyaLight();
      }
    } else {
      attendanceBtn.classList.remove('confirmed');
      localStorage.removeItem('mondal_bari_invite_confirmed');
      if (attendanceText) {
        attendanceText.textContent = t('invitation_confirm') || 'প্রণাম ও শারদ শুভেচ্ছা';
      }
    }
  });
}

/* ==========================================================================
   9. PONYTAIL INTERLOCKING SECTIONAL SCROLL LOCKING & SCROLLSPY ENGINE (PC ONLY)
   ========================================================================== */

let activeScrollAnimId = null;
let isProgrammaticScrolling = false;

/**
 * High-performance smooth scrolling with a firm, prominent ease-in / ease-in-out curve
 * Starts with swift ease-in acceleration, glides fluidly, firmly locks at arrival.
 * @param {number} targetY - Destination scrollTop in pixels
 * @param {number} duration - Animation duration in ms (default: 460ms)
 * @param {Function} onComplete - Callback executed when scroll finishes
 */
export function smoothScrollToTarget(targetY, duration = 460, onComplete = null) {
  if (activeScrollAnimId) {
    cancelAnimationFrame(activeScrollAnimId);
    activeScrollAnimId = null;
  }

  const scrollEl = document.scrollingElement || document.documentElement || document.body;
  const startY = window.pageYOffset || window.scrollY || scrollEl.scrollTop || 0;
  const maxScroll = Math.max(0, scrollEl.scrollHeight - window.innerHeight);
  const clampedTargetY = Math.max(0, Math.min(Math.round(targetY), maxScroll));
  const distance = clampedTargetY - startY;

  if (Math.abs(distance) < 2) {
    window.scrollTo(0, clampedTargetY);
    scrollEl.scrollTop = clampedTargetY;
    if (onComplete) onComplete();
    return;
  }

  isProgrammaticScrolling = true;

  // Ponytail Custom Subtle Ease-In-Out Curve (cubic-bezier):
  const easeInOutCubic = (t) => {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const startTime = performance.now();

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeInOutCubic(progress);

    const nextY = Math.round(startY + distance * easedProgress);
    window.scrollTo(0, nextY);
    scrollEl.scrollTop = nextY;

    if (progress < 1) {
      activeScrollAnimId = requestAnimationFrame(step);
    } else {
      window.scrollTo(0, clampedTargetY);
      scrollEl.scrollTop = clampedTargetY;
      activeScrollAnimId = null;
      isProgrammaticScrolling = false;
      if (onComplete) onComplete();
    }
  }

  activeScrollAnimId = requestAnimationFrame(step);
}

/**
 * Scroll smoothly to a specific DOM element or selector with firm ease-in motion
 */
export function smoothScrollToSection(elementOrId, duration = 460, offset = 0, onComplete = null) {
  const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const scrollEl = document.scrollingElement || document.documentElement || document.body;
  const currentScroll = window.pageYOffset || window.scrollY || scrollEl.scrollTop || 0;
  const targetY = rect.top + currentScroll + offset;
  smoothScrollToTarget(targetY, duration, onComplete);
}

function initSectionScrollLocking() {
  const nodes = document.querySelectorAll('.spy-node');
  const progressFill = document.getElementById('ponytail-spy-progress');

  const snapSections = [
    { id: 'hero-section', name: 'Hero' },
    { id: 'invitation-section', name: 'Invitation' },
    { id: 'photo-river-section', name: 'Photo River' },
    { id: 'onnota-section', name: 'Onnota' },
    { id: 'gallery-section', name: 'Gallery' }
  ];

  let currentSectionIdx = 0;
  let isGliding = false;
  let glideCooldownTimer = null;

  const getDocTop = (el) => {
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const scrollEl = document.scrollingElement || document.documentElement || document.body;
    const scrollY = window.pageYOffset || window.scrollY || scrollEl.scrollTop || 0;
    return rect.top + scrollY;
  };

  const getSectionHeight = (el) => {
    if (!el) return 0;
    return el.offsetHeight || el.getBoundingClientRect().height || 0;
  };

  // Helper to update active node state in the side bar and track progress
  const setActiveNode = (idx) => {
    currentSectionIdx = idx;
    nodes.forEach((node, nIdx) => {
      const isActive = nIdx === idx;
      node.classList.toggle('active', isActive);
      node.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  };

  // Lock to a specific section by index with smooth glide and frame clipping
  function lockToSectionIndex(targetIdx) {
    if (targetIdx < 0 || targetIdx >= snapSections.length) return;
    const targetSec = snapSections[targetIdx];
    const targetEl = document.getElementById(targetSec.id);
    if (!targetEl) return;

    isGliding = true;
    setActiveNode(targetIdx);

    const targetY = getDocTop(targetEl);

    smoothScrollToTarget(targetY, 460, () => {
      if (glideCooldownTimer) clearTimeout(glideCooldownTimer);
      glideCooldownTimer = setTimeout(() => {
        isGliding = false;
        updateScrollSpyLive();
      }, 100);
    });

    if (glideCooldownTimer) clearTimeout(glideCooldownTimer);
    glideCooldownTimer = setTimeout(() => {
      isGliding = false;
    }, 650);
  }

  // Real-time ScrollSpy & progress bar updater
  let isTicking = false;
  const updateScrollSpyLive = () => {
    if (!isTicking) {
      requestAnimationFrame(() => {
        const scrollEl = document.scrollingElement || document.documentElement || document.body;
        const scrollY = window.pageYOffset || window.scrollY || scrollEl.scrollTop || 0;
        const vh = window.innerHeight;
        const totalHeight = scrollEl.scrollHeight;
        const maxScroll = Math.max(1, totalHeight - vh);

        // Update progress bar (0% to 100%)
        if (progressFill) {
          const progressPercent = Math.min(100, Math.max(0, (scrollY / maxScroll) * 100));
          progressFill.style.height = `${progressPercent.toFixed(1)}%`;
        }

        if (!isGliding) {
          const focalY = vh * 0.45;
          let highestScore = -1;
          let bestIdx = 0;

          snapSections.forEach((s, idx) => {
            const el = document.getElementById(s.id);
            if (el) {
              const rect = el.getBoundingClientRect();
              const visibleTop = Math.max(0, rect.top);
              const visibleBottom = Math.min(vh, rect.bottom);
              const visibleHeight = Math.max(0, visibleBottom - visibleTop);
              const viewportCoverage = visibleHeight / vh;

              const containsFocalPoint = (rect.top <= focalY && rect.bottom >= focalY);
              const score = (containsFocalPoint ? 2.0 : 0.0) + viewportCoverage;

              if (score > highestScore) {
                highestScore = score;
                bestIdx = idx;
              }
            }
          });

          setActiveNode(bestIdx);
        }

        isTicking = false;
      });
      isTicking = true;
    }
  };

  window.addEventListener('scroll', updateScrollSpyLive, { passive: true });
  document.addEventListener('scroll', updateScrollSpyLive, { passive: true });
  window.addEventListener('resize', updateScrollSpyLive, { passive: true });
  updateScrollSpyLive();

  // 1. Navigation Dots Click Handlers
  nodes.forEach((node, idx) => {
    node.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      lockToSectionIndex(idx);
    });
  });

  // 2. Intercept In-Page Anchor Links (Scroll down cue, Next chapter buttons, etc.)
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#' || href === '#!') return;
      const targetId = href.substring(1);
      const targetIdx = snapSections.findIndex(s => s.id === targetId);
      if (targetIdx !== -1) {
        e.preventDefault();
        lockToSectionIndex(targetIdx);
      }
    });
  });

  // 3. Desktop Interlocking Sectional Wheel Controller (PC ONLY)
  window.addEventListener('wheel', (e) => {
    // Only apply on desktop / PC viewports (> 768px)
    if (window.innerWidth <= 768) return;

    // If a modal or lightbox dialog is active, allow internal modal scrolling
    const isModalOpen = !!(
      document.querySelector('.modal-backdrop.active') || 
      document.querySelector('#welcome-modal-overlay:not(.hidden)') ||
      document.querySelector('#gallery-lightbox-modal.active')
    );
    if (isModalOpen) {
      return;
    }

    // If currently gliding or animating, consume wheel event to lock the landing
    if (isProgrammaticScrolling || isGliding) {
      e.preventDefault();
      return;
    }

    const deltaThreshold = 6;
    if (Math.abs(e.deltaY) < deltaThreshold) return;

    const scrollEl = document.scrollingElement || document.documentElement || document.body;
    const scrollY = window.pageYOffset || window.scrollY || scrollEl.scrollTop || 0;
    const vh = window.innerHeight;

    // Get current section geometry
    const currentSec = snapSections[currentSectionIdx];
    const currentEl = document.getElementById(currentSec.id);
    if (!currentEl) return;

    const sectionTop = getDocTop(currentEl);
    const sectionHeight = getSectionHeight(currentEl);
    const sectionBottom = sectionTop + sectionHeight;

    // SCROLL DOWN (e.deltaY > 0)
    if (e.deltaY > 0) {
      // Single-viewport sections (Hero: 0, Photo River: 2) -> 1-scroll glide to next section
      if (currentSectionIdx === 0) {
        e.preventDefault();
        lockToSectionIndex(1);
        return;
      }
      if (currentSectionIdx === 2) {
        e.preventDefault();
        lockToSectionIndex(3);
        return;
      }

      // Tall sections (Invitation: 1, Onnota: 3)
      if (currentSectionIdx === 1 || currentSectionIdx === 3) {
        const atSectionBottom = (scrollY + vh >= sectionBottom - 20);
        if (atSectionBottom) {
          e.preventDefault();
          lockToSectionIndex(currentSectionIdx + 1);
          return;
        }
        // Not at bottom yet -> allow natural general scrolling inside this section
        return;
      }

      // Grand Gallery (Section 4) -> full general scrolling
      if (currentSectionIdx === 4) {
        return;
      }
    }

    // SCROLL UP (e.deltaY < 0)
    else if (e.deltaY < 0) {
      // Hero (Section 0) -> stay at top
      if (currentSectionIdx === 0) {
        return;
      }

      // Single-viewport section (Photo River: 2) -> 1-scroll glide back to Invitation
      if (currentSectionIdx === 2) {
        e.preventDefault();
        lockToSectionIndex(1);
        return;
      }

      // Tall sections (Invitation: 1, Onnota: 3, Gallery: 4)
      if (currentSectionIdx === 1 || currentSectionIdx === 3 || currentSectionIdx === 4) {
        const atSectionTop = (scrollY <= sectionTop + 20);
        if (atSectionTop) {
          e.preventDefault();
          lockToSectionIndex(currentSectionIdx - 1);
          return;
        }
        // Not at top yet -> allow natural general scrolling up inside this section
        return;
      }
    }
  }, { passive: false });

  // 4. Keyboard Page Navigation (PageDown, PageUp)
  window.addEventListener('keydown', (e) => {
    if (['input', 'textarea', 'select'].includes(document.activeElement?.tagName?.toLowerCase())) return;

    if (e.key === 'PageDown' || e.key === 'PageUp') {
      const direction = e.key === 'PageDown' ? 1 : -1;
      const nextIdx = Math.max(0, Math.min(snapSections.length - 1, currentSectionIdx + direction));
      if (nextIdx !== currentSectionIdx) {
        e.preventDefault();
        lockToSectionIndex(nextIdx);
      }
    }
  });
}
