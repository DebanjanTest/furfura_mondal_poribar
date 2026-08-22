// Web Audio Synthesizer & Physical Modeling Engine for Authentic Bengali Percussion
// Specialized in Bengali Dhak, Kansor Ghonta, and Shankha Acoustics
// Incorporates Jackfruit Wood Shell Resonance, Kanchi Bamboo Transients, and Traditional Puja Bols.
// Built for 100% Zero-Latency, Zero-Artifact Seamless Continuous Looping.

import { TRADITIONAL_BOLS } from '../data/playlists.js';
export { TRADITIONAL_BOLS };

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;
    this.masterGain = null;
    this.bassBoostNode = null;
    this.snapBoostNode = null;
    this.masterCompressor = null;
    this.distortionCurveCache = null;
    this.noiseBufferCache = null;
    this.bassBoostDb = 6.0;
    this.snapBoostDb = 4.0;
    this.masterOutputLevel = 1.2;
    this.isRadioPlaying = false;
    this.melodyTimeout = null;
  }

  resumeAudioContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      return this.ctx.resume();
    }
    return Promise.resolve();
  }

  // Real-time Bengali Shehnai & Sacred Agomoni Melody Synthesizer
  startFestivePujaRadio(trackTitle = 'দুগ্গা এলো') {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.melodyTimeout) clearTimeout(this.melodyTimeout);

    this.isRadioPlaying = true;
    const ctx = this.ctx;

    // Sacred Raga Bhairav scale (Sa, Re_k, Ga, Ma, Pa, Dha_k, Ni, Sa')
    const scale = [261.63, 277.18, 329.63, 349.23, 392.00, 415.30, 493.88, 523.25];
    
    // Traditional Agomoni melody phrase
    const phrase = [
      { note: 0, dur: 0.6 }, { note: 2, dur: 0.4 }, { note: 4, dur: 0.8 }, { note: 5, dur: 0.4 },
      { note: 4, dur: 0.6 }, { note: 3, dur: 0.4 }, { note: 2, dur: 0.8 }, { note: 1, dur: 0.6 },
      { note: 0, dur: 1.0 }, { note: 4, dur: 0.6 }, { note: 5, dur: 0.6 }, { note: 7, dur: 1.2 },
      { note: 6, dur: 0.6 }, { note: 5, dur: 0.6 }, { note: 4, dur: 0.8 }, { note: 2, dur: 0.6 },
      { note: 1, dur: 0.8 }, { note: 0, dur: 1.5 }
    ];

    let stepIndex = 0;
    const playNextNote = () => {
      if (!this.isRadioPlaying || !this.ctx) return;
      const item = phrase[stepIndex % phrase.length];
      const freq = scale[item.note];
      const duration = item.dur;
      const t = ctx.currentTime;

      // Shehnai Dual Reed Sound Design
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      const noteGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, t);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 1.004, t);

      vibrato.frequency.setValueAtTime(5.5, t);
      vibratoGain.gain.setValueAtTime(3.5, t);
      vibrato.connect(osc1.frequency);
      vibrato.connect(osc2.frequency);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.Q.setValueAtTime(2.8, t);

      noteGain.gain.setValueAtTime(0.001, t);
      noteGain.gain.linearRampToValueAtTime(0.22, t + 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.masterGain);

      vibrato.start(t);
      osc1.start(t);
      osc2.start(t);

      vibrato.stop(t + duration);
      osc1.stop(t + duration);
      osc2.stop(t + duration);

      // Accompany with authentic Dhak & Kansor beats
      if (stepIndex % 4 === 0) {
        this.playDha(0.75, t);
      } else if (stepIndex % 2 === 0) {
        this.playTa(0.45, t);
      }
      if (stepIndex % 8 === 0) {
        this.playKansor(0.35, t);
      }

      stepIndex++;
      this.melodyTimeout = setTimeout(playNextNote, duration * 920);
    };

    playNextNote();
  }

  stopFestivePujaRadio() {
    this.isRadioPlaying = false;
    if (this.melodyTimeout) clearTimeout(this.melodyTimeout);
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Studio Mastering Chain:
      // Sources -> Bass Boost Filter -> Snap EQ Filter -> Master Compressor (Glue/Limiter) -> Master Gain -> Destination

      this.bassBoostNode = this.ctx.createBiquadFilter();
      this.bassBoostNode.type = 'lowshelf';
      this.bassBoostNode.frequency.setValueAtTime(90, this.ctx.currentTime);
      this.bassBoostNode.gain.setValueAtTime(this.bassBoostDb, this.ctx.currentTime);

      this.snapBoostNode = this.ctx.createBiquadFilter();
      this.snapBoostNode.type = 'peaking';
      this.snapBoostNode.frequency.setValueAtTime(2400, this.ctx.currentTime);
      this.snapBoostNode.Q.setValueAtTime(2.2, this.ctx.currentTime);
      this.snapBoostNode.gain.setValueAtTime(this.snapBoostDb, this.ctx.currentTime);

      this.masterCompressor = this.ctx.createDynamicsCompressor();
      this.masterCompressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.masterCompressor.knee.setValueAtTime(8, this.ctx.currentTime);
      this.masterCompressor.ratio.setValueAtTime(4.5, this.ctx.currentTime);
      this.masterCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.masterCompressor.release.setValueAtTime(0.12, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterOutputLevel, this.ctx.currentTime);

      // Connect Studio Master Chain
      this.bassBoostNode.connect(this.snapBoostNode);
      this.snapBoostNode.connect(this.masterCompressor);
      this.masterCompressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isInitialized = true;
  }

  setBassBoost(gainDb) {
    this.bassBoostDb = Number(gainDb);
    if (this.bassBoostNode && this.ctx) {
      this.bassBoostNode.gain.setValueAtTime(this.bassBoostDb, this.ctx.currentTime);
    }
  }

  setSnapBoost(gainDb) {
    this.snapBoostDb = Number(gainDb);
    if (this.snapBoostNode && this.ctx) {
      this.snapBoostNode.gain.setValueAtTime(this.snapBoostDb, this.ctx.currentTime);
    }
  }

  setMasterOutputLevel(val) {
    this.masterOutputLevel = Math.max(0.1, Math.min(2.0, Number(val)));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.masterOutputLevel, this.ctx.currentTime);
    }
  }

  getDistortionCurve(amount = 20) {
    if (this.distortionCurveCache && this.distortionCurveCache.amount === amount) {
      return this.distortionCurveCache.curve;
    }
    const k = typeof amount === 'number' ? amount : 20;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    this.distortionCurveCache = { amount, curve };
    return curve;
  }

  createNoiseBuffer(duration = 0.5) {
    if (!this.ctx) this.init();
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // =========================================================================
  // 1. DHA (Open Bass Shell Resonance - Multi-layered Acoustic Modeling)
  // Layer 1: Sub punch sine sweep (110Hz -> 52Hz)
  // Layer 2: Jackfruit wood cavity (82Hz Q=4.5 bandpass + warm wave shaper)
  // Layer 3: Modal hide harmonics (74Hz, 148Hz, 222Hz, 310Hz)
  // Layer 4: Wrist palm hide impact slap (850Hz filtered noise transient)
  // =========================================================================
  playDha(velocity = 1.0, time = null) {
    this.init();
    const ctx = this.ctx;
    const t = time !== null ? time : ctx.currentTime;
    const safeVel = Math.max(0.1, Math.min(1.3, velocity));
    const humanJitter = (Math.random() - 0.5) * 1.5;

    const strikeBus = ctx.createGain();
    strikeBus.gain.setValueAtTime(0.001, t);
    strikeBus.gain.linearRampToValueAtTime(1.05 * safeVel, t + 0.002);
    strikeBus.gain.exponentialRampToValueAtTime(0.001, t + 0.68);

    // Warm Jackfruit wood cavity saturation
    const shaper = ctx.createWaveShaper();
    shaper.curve = this.getDistortionCurve(18);
    shaper.oversample = '2x';

    // Air cavity resonance filter (Kathal wood 82Hz Q=4.5)
    const cavityFilter = ctx.createBiquadFilter();
    cavityFilter.type = 'bandpass';
    cavityFilter.frequency.setValueAtTime(82 + humanJitter, t);
    cavityFilter.Q.setValueAtTime(4.5, t);

    // Deep sub-bass punch shelf
    const subShelf = ctx.createBiquadFilter();
    subShelf.type = 'lowshelf';
    subShelf.frequency.setValueAtTime(80, t);
    subShelf.gain.setValueAtTime(5.0, t);

    strikeBus.connect(shaper);
    shaper.connect(cavityFilter);
    cavityFilter.connect(subShelf);
    subShelf.connect(this.bassBoostNode);

    // LAYER 1: Deep Sub Kick Transient Sweep
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(115 + humanJitter, t);
    subOsc.frequency.exponentialRampToValueAtTime(52, t + 0.045);

    subGain.gain.setValueAtTime(1.15 * safeVel, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.44);

    subOsc.connect(subGain);
    subGain.connect(strikeBus);
    subOsc.start(t);
    subOsc.stop(t + 0.46);

    // LAYER 2: Modal Shell Harmonics
    const harmonics = [
      { freq: 74, gain: 1.0, decay: 0.60, type: 'sine' },
      { freq: 148, gain: 0.70, decay: 0.44, type: 'triangle' },
      { freq: 222, gain: 0.40, decay: 0.30, type: 'sine' },
      { freq: 310, gain: 0.24, decay: 0.19, type: 'triangle' }
    ];

    harmonics.forEach(({ freq, gain: hGain, decay, type }) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = type;

      const startFreq = (freq / 74) * (96 + humanJitter);
      const endFreq = freq + humanJitter;
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.04);

      oscGain.gain.setValueAtTime(hGain * safeVel, t);
      oscGain.gain.exponentialRampToValueAtTime(0.0005, t + decay);

      osc.connect(oscGain);
      oscGain.connect(strikeBus);

      osc.start(t);
      osc.stop(t + decay + 0.05);
    });

    // LAYER 3: Flesh/Palm Leather Impact Slap (Transient Hide Click)
    const noiseBuf = this.createNoiseBuffer(0.04);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuf;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(950, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.50 * safeVel, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.024);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(strikeBus);

    noiseSource.start(t);
    noiseSource.stop(t + 0.038);
  }

  // =========================================================================
  // 2. DYANG (High-Tension Bamboo Stick Snap - Kanchi Strike)
  // Pitch drop: 380Hz -> 310Hz over 20ms
  // Bamboo transient crack: 2400Hz bandpass burst, 7ms
  // Peaking filter: 2100Hz +8.5dB
  // =========================================================================
  playDyang(velocity = 1.0, time = null) {
    this.init();
    const ctx = this.ctx;
    const t = time !== null ? time : ctx.currentTime;
    const safeVel = Math.max(0.1, Math.min(1.3, velocity));
    const humanJitter = (Math.random() - 0.5) * 3;

    const strikeBus = ctx.createGain();
    strikeBus.gain.setValueAtTime(0.001, t);
    strikeBus.gain.linearRampToValueAtTime(1.0 * safeVel, t + 0.0007);
    strikeBus.gain.exponentialRampToValueAtTime(0.001, t + 0.26);

    const shaper = ctx.createWaveShaper();
    shaper.curve = this.getDistortionCurve(36);
    shaper.oversample = '2x';

    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.setValueAtTime(260, t);

    const peakFilter = ctx.createBiquadFilter();
    peakFilter.type = 'peaking';
    peakFilter.frequency.setValueAtTime(2200 + humanJitter, t);
    peakFilter.Q.setValueAtTime(3.8, t);
    peakFilter.gain.setValueAtTime(8.5, t);

    strikeBus.connect(shaper);
    shaper.connect(hpFilter);
    hpFilter.connect(peakFilter);
    peakFilter.connect(this.bassBoostNode);

    const harmonics = [
      { freq: 310, gain: 0.95, decay: 0.22, type: 'triangle' },
      { freq: 620, gain: 0.62, decay: 0.16, type: 'sine' },
      { freq: 1240, gain: 0.46, decay: 0.12, type: 'triangle' },
      { freq: 2350, gain: 0.36, decay: 0.08, type: 'sine' }
    ];

    harmonics.forEach(({ freq, gain: hGain, decay, type }) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = type;

      const startFreq = (freq / 310) * (380 + humanJitter);
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(freq + humanJitter, t + 0.02);

      oscGain.gain.setValueAtTime(hGain * safeVel, t);
      oscGain.gain.exponentialRampToValueAtTime(0.0005, t + decay);

      osc.connect(oscGain);
      oscGain.connect(strikeBus);

      osc.start(t);
      osc.stop(t + decay + 0.02);
    });

    // Bamboo Kanchi transient snap (2400Hz burst)
    const noiseBuf = this.createNoiseBuffer(0.025);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuf;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2400 + humanJitter, t);
    noiseFilter.Q.setValueAtTime(2.6, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.95 * safeVel, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.009);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(strikeBus);

    noiseSource.start(t);
    noiseSource.stop(t + 0.02);
  }

  // =========================================================================
  // 3. TA (Open Bamboo Stick Rim Strike)
  // Crisp resonant edge click, bright overtone ring
  // =========================================================================
  playTa(velocity = 1.0, time = null) {
    this.init();
    const ctx = this.ctx;
    const t = time !== null ? time : ctx.currentTime;
    const safeVel = Math.max(0.1, Math.min(1.3, velocity));
    const humanJitter = (Math.random() - 0.5) * 3;

    const strikeBus = ctx.createGain();
    strikeBus.gain.setValueAtTime(0.001, t);
    strikeBus.gain.linearRampToValueAtTime(0.94 * safeVel, t + 0.0007);
    strikeBus.gain.exponentialRampToValueAtTime(0.001, t + 0.19);

    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.setValueAtTime(320, t);

    const peakFilter = ctx.createBiquadFilter();
    peakFilter.type = 'peaking';
    peakFilter.frequency.setValueAtTime(2550 + humanJitter, t);
    peakFilter.Q.setValueAtTime(4.2, t);
    peakFilter.gain.setValueAtTime(7.5, t);

    strikeBus.connect(hpFilter);
    hpFilter.connect(peakFilter);
    peakFilter.connect(this.bassBoostNode);

    const harmonics = [
      { freq: 330, gain: 0.92, decay: 0.17, type: 'triangle' },
      { freq: 790, gain: 0.58, decay: 0.11, type: 'sine' }
    ];

    harmonics.forEach(({ freq, gain: hGain, decay, type }) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq + humanJitter + 75, t);
      osc.frequency.exponentialRampToValueAtTime(freq + humanJitter, t + 0.015);
      oscGain.gain.setValueAtTime(hGain * safeVel, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + decay);

      osc.connect(oscGain);
      oscGain.connect(strikeBus);
      osc.start(t);
      osc.stop(t + decay + 0.01);
    });

    const noiseBuf = this.createNoiseBuffer(0.018);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuf;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2450 + humanJitter, t);
    noiseFilter.Q.setValueAtTime(2.8, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.85 * safeVel, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.007);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(strikeBus);

    noiseSource.start(t);
    noiseSource.stop(t + 0.016);
  }

  // =========================================================================
  // 4. KUT (Damped / Ghost Stroke - Finger/Palm Heel Mute)
  // =========================================================================
  playKut(velocity = 1.0, time = null) {
    this.init();
    const ctx = this.ctx;
    const t = time !== null ? time : ctx.currentTime;
    const safeVel = Math.max(0.1, Math.min(1.3, velocity));

    const strikeBus = ctx.createGain();
    strikeBus.gain.setValueAtTime(0.001, t);
    strikeBus.gain.linearRampToValueAtTime(0.78 * safeVel, t + 0.0005);
    strikeBus.gain.exponentialRampToValueAtTime(0.0005, t + 0.05);

    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.setValueAtTime(340, t);

    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.setValueAtTime(1700, t);

    strikeBus.connect(hpFilter);
    hpFilter.connect(lpFilter);
    lpFilter.connect(this.bassBoostNode);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(430, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.008);

    oscGain.gain.setValueAtTime(0.72 * safeVel, t);
    oscGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.04);

    osc.connect(oscGain);
    oscGain.connect(strikeBus);
    osc.start(t);
    osc.stop(t + 0.045);

    const noiseBuf = this.createNoiseBuffer(0.012);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuf;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1450, t);
    noiseFilter.Q.setValueAtTime(2.2, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.62 * safeVel, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.005);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(strikeBus);

    noiseSource.start(t);
    noiseSource.stop(t + 0.01);
  }

  // =========================================================================
  // 5. GURGUR (Rapid Double-Stick Alternating Micro-Roll)
  // =========================================================================
  playGurgur(velocity = 1.0, hits = 6, time = null) {
    this.init();
    const ctx = this.ctx;
    const baseTime = time !== null ? time : ctx.currentTime;
    const safeVel = Math.max(0.1, Math.min(1.3, velocity));
    const interval = 0.034; // ~29Hz rapid roll speed

    for (let i = 0; i < hits; i++) {
      const jitter = (Math.random() * 0.003 - 0.0015);
      const hitTime = baseTime + i * interval + jitter;
      const crescendo = 0.84 + (i / hits) * 0.30;
      const hitVel = safeVel * (0.90 + Math.random() * 0.20) * crescendo;

      if (i % 2 === 0) {
        this.playDyang(hitVel * 0.92, hitTime);
      } else {
        this.playTa(hitVel * 0.88, hitTime);
      }
    }
  }

  // =========================================================================
  // 6. KANSOR GHONTA (Dual-Frequency Bell-Metal Plate)
  // Primary 1468Hz + Secondary 2936Hz, FM shimmer at 734Hz, 2.4s decay
  // =========================================================================
  playKansor(velocity = 1.0, type = 'CLANG_HIGH', time = null) {
    this.init();
    const ctx = this.ctx;
    const t = time !== null ? time : ctx.currentTime;
    const safeVel = Math.max(0.1, Math.min(1.2, velocity));

    const masterKansorGain = ctx.createGain();
    masterKansorGain.gain.setValueAtTime(0.001, t);
    masterKansorGain.gain.linearRampToValueAtTime(0.92 * safeVel, t + 0.0006);
    masterKansorGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(480, t);

    const bellReverb = ctx.createBiquadFilter();
    bellReverb.type = 'peaking';
    bellReverb.frequency.setValueAtTime(1468, t);
    bellReverb.Q.setValueAtTime(12.0, t);
    bellReverb.gain.setValueAtTime(6.0, t);

    masterKansorGain.connect(highpass);
    highpass.connect(bellReverb);
    bellReverb.connect(this.masterGainNode);

    const kansorPartials = type === 'CLANG_HIGH'
      ? [
          { freq: 1468, gain: 0.95, decay: 2.3, type: 'sine' },
          { freq: 2936, gain: 0.72, decay: 1.8, type: 'sine' },
          { freq: 4404, gain: 0.44, decay: 1.1, type: 'sine' },
          { freq: 5872, gain: 0.28, decay: 0.7, type: 'sine' },
          { freq: 734,  gain: 0.38, decay: 2.1, type: 'triangle' }
        ]
      : [
          { freq: 980,  gain: 0.95, decay: 2.6, type: 'sine' },
          { freq: 1960, gain: 0.68, decay: 2.0, type: 'sine' },
          { freq: 2940, gain: 0.42, decay: 1.3, type: 'sine' },
          { freq: 490,  gain: 0.45, decay: 2.4, type: 'triangle' }
        ];

    kansorPartials.forEach(({ freq, gain: pGain, decay, type: pType }) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = pType;

      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      mod.type = 'sine';
      mod.frequency.setValueAtTime(6.2, t);
      modGain.gain.setValueAtTime(3.8, t);
      mod.connect(modGain);
      modGain.connect(osc.frequency);
      mod.start(t);
      mod.stop(t + decay + 0.05);

      osc.frequency.setValueAtTime(freq, t);
      oscGain.gain.setValueAtTime(pGain * safeVel, t);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

      osc.connect(oscGain);
      oscGain.connect(masterKansorGain);

      osc.start(t);
      osc.stop(t + decay + 0.05);
    });

    const noiseBuf = this.createNoiseBuffer(0.015);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuf;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(3600, t);
    noiseFilter.Q.setValueAtTime(3.5, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.68 * safeVel, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.008);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterKansorGain);

    noiseSource.start(t);
    noiseSource.stop(t + 0.012);
  }

  // =========================================================================
  // 7. SHANKHA (Rich 432Hz Sacred Conch Shell Synthesizer)
  // 4.8Hz natural lip vibrato (22 cents), 5 harmonics, formants at 880Hz & 1740Hz
  // =========================================================================
  playShankha(durationSec = 2.8, time = null) {
    this.init();
    const ctx = this.ctx;
    const t = time !== null ? time : ctx.currentTime;
    const dur = Math.max(1.0, durationSec);

    const masterShankhaGain = ctx.createGain();
    masterShankhaGain.gain.setValueAtTime(0.001, t);
    masterShankhaGain.gain.exponentialRampToValueAtTime(0.88, t + 0.28);
    masterShankhaGain.gain.setValueAtTime(0.92, t + dur - 0.65);
    masterShankhaGain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    const formant1 = ctx.createBiquadFilter();
    formant1.type = 'peaking';
    formant1.frequency.setValueAtTime(880, t);
    formant1.Q.setValueAtTime(4.5, t);
    formant1.gain.setValueAtTime(5.5, t);

    const formant2 = ctx.createBiquadFilter();
    formant2.type = 'peaking';
    formant2.frequency.setValueAtTime(1740, t);
    formant2.Q.setValueAtTime(5.2, t);
    formant2.gain.setValueAtTime(4.0, t);

    masterShankhaGain.connect(formant1);
    formant1.connect(formant2);
    formant2.connect(this.bassBoostNode);

    const vibratoLfo = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibratoLfo.frequency.setValueAtTime(4.8, t);
    vibratoGain.gain.setValueAtTime(5.8, t);
    vibratoLfo.connect(vibratoGain);
    vibratoLfo.start(t);
    vibratoLfo.stop(t + dur + 0.1);

    const baseFreq = 432.0;
    const harmonics = [
      { mult: 1, gain: 1.0 },
      { mult: 2, gain: 0.75 },
      { mult: 3, gain: 0.50 },
      { mult: 4, gain: 0.32 },
      { mult: 5, gain: 0.16 }
    ];

    harmonics.forEach(({ mult, gain: hGain }) => {
      const osc = ctx.createOscillator();
      const hGainNode = ctx.createGain();

      osc.type = 'sawtooth';
      const targetFreq = baseFreq * mult;

      osc.frequency.setValueAtTime(targetFreq * 0.98, t);
      osc.frequency.exponentialRampToValueAtTime(targetFreq * 1.015, t + 0.4);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, t + 0.9);
      osc.frequency.exponentialRampToValueAtTime(targetFreq * 0.95, t + dur);

      vibratoGain.connect(osc.frequency);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(targetFreq, t);
      filter.Q.setValueAtTime(5.5, t);

      hGainNode.gain.setValueAtTime(hGain * 0.48, t);

      osc.connect(filter);
      filter.connect(hGainNode);
      hGainNode.connect(masterShankhaGain);

      osc.start(t);
      osc.stop(t + dur + 0.1);
    });

    const noiseBuf = this.createNoiseBuffer(dur);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuf;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1200, t);
    noiseFilter.Q.setValueAtTime(3.0, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, t);
    noiseGain.gain.linearRampToValueAtTime(0.085, t + 0.3);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterShankhaGain);

    noiseSource.start(t);
    noiseSource.stop(t + dur);
  }

  // =========================================================================
  // Compatibility Aliases
  // =========================================================================
  playDhakBass(velocity = 1.0) {
    this.playDha(velocity);
  }

  playDhakStick(velocity = 1.0) {
    this.playTa(velocity);
  }

  playKashor(velocity = 1.0) {
    this.playKansor(velocity, 'CLANG_HIGH');
  }

  stopAll() {
    if (dhakSequencer.isPlaying) {
      dhakSequencer.stop();
    }
  }

  toggleDhakRhythm(onBeatCallback) {
    if (dhakSequencer.isPlaying) {
      dhakSequencer.stop();
      return false;
    }
    dhakSequencer.onStepCallback = onBeatCallback;
    dhakSequencer.start();
    return true;
  }
}

// ===========================================================================
// ULTRA-HIGH-PRECISION SEAMLESS LOOP ENGINE / DHAK SEQUENCER
// Features:
// - Sub-millisecond AudioContext lookahead scheduling with zero gap/stutter.
// - Musical Quantized Bar Switching (transitions cleanly at step 0).
// - Zero speech/voice artifacts — pure physical modeling synthesis.
// - Continuous infinite loop capability with bar cycle notifications.
// - Dynamic smooth BPM alteration & Accelerando.
// ===========================================================================
export class DhakSequencer {
  constructor(audioEngine) {
    this.engine = audioEngine;
    this.bols = TRADITIONAL_BOLS;
    this.currentBolIndex = 0;
    this.pendingBolIndex = null; // for quantized bar-boundary switching
    this.currentStyleMode = 'duk_kathi';
    this.bpm = 112;
    this.isPlaying = false;
    this.isLooping = true;
    this.isAccelerando = false;
    this.volume = 1.0;
    this.barCount = 0;

    // Sub-millisecond Lookahead Scheduler State
    this.currentStep = 0;
    this.nextStepTime = 0.0;
    this.lookaheadIntervalMs = 20; // 20ms polling interval
    this.scheduleAheadSec = 0.15;  // 150ms lookahead window
    this.timerId = null;

    // Callbacks
    this.onStepCallback = null;
    this.onBpmChangeCallback = null;
    this.onBarLoopCallback = null;
    this.onPartChangeCallback = null;

    // UI tracking queue
    this.uiScheduleQueue = [];
    this.uiCheckInterval = null;
  }

  get currentBol() {
    return this.bols[this.currentBolIndex] || this.bols[0];
  }

  get totalParts() {
    return this.bols.length;
  }

  // Set bol / part. If quantized=true and currently playing, waits for the next bar boundary (step 0).
  setBol(bolIdOrIndex, quantized = true) {
    let targetIdx = -1;
    if (typeof bolIdOrIndex === 'number') {
      targetIdx = this.bols.findIndex(b => b.id === bolIdOrIndex);
      if (targetIdx === -1 && bolIdOrIndex >= 0 && bolIdOrIndex < this.bols.length) {
        targetIdx = bolIdOrIndex;
      }
    } else if (typeof bolIdOrIndex === 'string') {
      targetIdx = this.bols.findIndex(b => String(b.id) === bolIdOrIndex || b.num === bolIdOrIndex);
    }

    if (targetIdx === -1) targetIdx = 0;

    if (this.isPlaying && quantized) {
      // Queue switch at the next bar boundary (step 0)
      this.pendingBolIndex = targetIdx;
      return { status: 'queued', targetIndex: targetIdx };
    } else {
      this.applyBolChange(targetIdx);
      return { status: 'applied', targetIndex: targetIdx };
    }
  }

  applyBolChange(targetIdx) {
    this.currentBolIndex = targetIdx;
    this.pendingBolIndex = null;
    const bol = this.bols[targetIdx];
    this.bpm = bol.tempoBpm;
    if (bol.style) {
      this.currentStyleMode = bol.style;
    }
    if (this.onBpmChangeCallback) {
      this.onBpmChangeCallback(this.bpm);
    }
    if (this.onPartChangeCallback) {
      this.onPartChangeCallback(targetIdx, bol);
    }
  }

  setStyleMode(mode) {
    if (['ak_kathi', 'duk_kathi', 'procession_swing', 'bisarjan_swing', 'jugalbandi_solo', 'accelerando', 'dankuni_hooghly_heritage'].includes(mode)) {
      this.currentStyleMode = mode;
    }
  }

  setBpm(newBpm) {
    this.bpm = Math.max(50, Math.min(220, Number(newBpm)));
    if (this.onBpmChangeCallback) {
      this.onBpmChangeCallback(this.bpm);
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0.0, Math.min(1.5, Number(vol)));
    if (this.engine.masterGain && this.engine.ctx) {
      this.engine.masterGain.gain.setValueAtTime(this.volume * this.engine.masterOutputLevel, this.engine.ctx.currentTime);
    }
  }

  setAccelerando(enabled) {
    this.isAccelerando = Boolean(enabled);
  }

  setLooping(enabled) {
    this.isLooping = Boolean(enabled);
  }

  start() {
    if (this.isPlaying) return;
    this.engine.init();
    this.isPlaying = true;
    this.currentStep = 0;
    this.barCount = 0;
    this.nextStepTime = this.engine.ctx.currentTime + 0.05;

    // Start scheduling lookahead loop
    this.timerId = setInterval(() => this.scheduler(), this.lookaheadIntervalMs);

    // Start UI animation sync check
    this.uiCheckInterval = setInterval(() => this.processUiQueue(), 12);
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.uiCheckInterval) {
      clearInterval(this.uiCheckInterval);
      this.uiCheckInterval = null;
    }
    this.uiScheduleQueue = [];
    this.currentStep = 0;
    this.pendingBolIndex = null;
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  scheduler() {
    if (!this.isPlaying || !this.engine.ctx) return;

    // Look ahead and schedule all events within the scheduling window
    while (this.nextStepTime < this.engine.ctx.currentTime + this.scheduleAheadSec) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.advanceStep();
    }
  }

  advanceStep() {
    const bol = this.currentBol;
    const totalSteps = bol.barLengthSteps || 16;
    const stepDuration = (60.0 / this.bpm) / 4.0; // 16th note division

    // Calculate swing offset on odd 16th sub-beats
    let swingOffset = 0;
    const swingFactor = bol.swingFactor || 0.1;
    if (this.currentStep % 2 === 1) {
      swingOffset = stepDuration * swingFactor;
    }

    this.nextStepTime += stepDuration + swingOffset;
    this.currentStep = (this.currentStep + 1) % totalSteps;

    // Check if full musical bar loop completed
    if (this.currentStep === 0) {
      this.barCount++;

      // Check if not looping and completed 1 bar
      if (!this.isLooping && this.barCount >= 1) {
        // Will finish scheduled buffer then stop
        setTimeout(() => {
          if (!this.isLooping && this.isPlaying) this.stop();
        }, this.scheduleAheadSec * 1000);
      }

      // Handle Quantized Part Switch at Bar Boundary
      if (this.pendingBolIndex !== null) {
        this.applyBolChange(this.pendingBolIndex);
      }

      // Handle Accelerando progression
      if (this.isAccelerando) {
        const currentB = this.currentBol;
        const maxBpm = currentB.tempoClimaxBpm || Math.round(currentB.tempoBpm * 1.25);
        if (this.bpm < maxBpm) {
          this.bpm = Math.min(maxBpm, this.bpm + 2.0);
          if (this.onBpmChangeCallback) {
            this.onBpmChangeCallback(this.bpm);
          }
        }
      }

      // Notify Bar Loop Callback for real-time pulse animation
      if (this.onBarLoopCallback) {
        this.onBarLoopCallback(this.barCount, this.currentBolIndex);
      }
    }
  }

  scheduleStep(stepIndex, audioTime) {
    const bol = this.currentBol;
    const totalSteps = bol.barLengthSteps || 16;
    const stepData = bol.stepSequence[stepIndex % bol.stepSequence.length];

    if (!stepData) return;

    let { stroke, velocity, accent, kansor, phonetic } = stepData;
    let effectiveVel = velocity;

    // Micro-adjust dynamics by style mode
    if (this.currentStyleMode === 'ak_kathi') {
      if (stroke === 'DHA') effectiveVel *= 1.12;
      if (stroke === 'GUR_GUR') effectiveVel *= 0.82;
    } else if (this.currentStyleMode === 'duk_kathi') {
      if (stroke === 'DYANG' || stroke === 'TA') effectiveVel *= 1.08;
      if (stroke === 'GUR_GUR') effectiveVel *= 1.15;
    } else if (this.currentStyleMode === 'procession_swing') {
      if (stepIndex === 0 || stepIndex === 4 || stepIndex === 8 || stepIndex === 14) {
        effectiveVel *= 1.15;
      }
    } else if (this.currentStyleMode === 'bisarjan_swing') {
      if (stepIndex === 0 || stepIndex === 6 || stepIndex === 8 || stepIndex === 12) {
        effectiveVel *= 1.18;
      }
    } else if (this.currentStyleMode === 'jugalbandi_solo') {
      if (stroke === 'GUR_GUR' || stroke === 'KUT') effectiveVel *= 1.12;
    }

    // Trigger Physical Modeling Percussion Nodes
    if (stroke === 'DHA') {
      this.engine.playDha(effectiveVel, audioTime);
    } else if (stroke === 'DYANG') {
      this.engine.playDyang(effectiveVel, audioTime);
    } else if (stroke === 'TA') {
      this.engine.playTa(effectiveVel, audioTime);
    } else if (stroke === 'KUT') {
      this.engine.playKut(effectiveVel, audioTime);
    } else if (stroke === 'GUR_GUR') {
      this.engine.playGurgur(effectiveVel, 4, audioTime);
    }

    // Schedule Kanshor bell accompaniment
    if (kansor && kansor !== 'NONE') {
      const kansorVel = accent ? 0.95 : 0.65;
      this.engine.playKansor(kansorVel, kansor, audioTime);
    }

    // Schedule Shankha triggers if defined for this step
    if (bol.shankhaTriggers) {
      const sTrigger = bol.shankhaTriggers.find(t => t.step === stepIndex);
      if (sTrigger) {
        this.engine.playShankha((sTrigger.durationMs || 1500) / 1000, audioTime);
      }
    }

    // Push to UI queue for synchronized visual rendering
    this.uiScheduleQueue.push({
      time: audioTime,
      step: stepIndex,
      totalSteps,
      stroke,
      phonetic,
      accent,
      kansor,
      bpm: this.bpm,
      partIndex: this.currentBolIndex
    });
  }

  processUiQueue() {
    if (!this.engine.ctx) return;
    const now = this.engine.ctx.currentTime;

    while (this.uiScheduleQueue.length > 0 && this.uiScheduleQueue[0].time <= now) {
      const ev = this.uiScheduleQueue.shift();
      if (this.onStepCallback) {
        this.onStepCallback(ev);
      }
    }
  }
}

// Global Singletons
export const audioEngine = new AudioEngine();
export const dhakSequencer = new DhakSequencer(audioEngine);

