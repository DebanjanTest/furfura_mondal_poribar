// Clean Audio Engine for Master Dynamics & Audio Context Management
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;
    this.masterGain = null;
    this.masterOutputLevel = 1.2;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterOutputLevel, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isInitialized = true;
  }

  resumeAudioContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      return this.ctx.resume();
    }
    return Promise.resolve();
  }

  setMasterOutputLevel(val) {
    this.masterOutputLevel = Math.max(0.1, Math.min(2.0, Number(val)));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.masterOutputLevel, this.ctx.currentTime);
    }
  }

  stopAll() {
    // Clean audio release
  }
}

export const audioEngine = new AudioEngine();
