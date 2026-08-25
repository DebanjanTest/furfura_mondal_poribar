// Atmospheric Particles: Authentic Falling Shiuli Flowers, Golden Sparkles & Floating Kash Phool
// Built with Ponytail Canvas Rendering Standards

export class ParticleSystem {
  constructor(canvasId = 'particle-canvas') {
    this.canvasId = canvasId;
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.animationFrame = null;
    this.enabled = true;
    this.timeOfDay = 'morning';
    this.resizeHandler = this.resize.bind(this);
  }

  init() {
    this.canvas = document.getElementById(this.canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.removeEventListener('resize', this.resizeHandler);
    window.addEventListener('resize', this.resizeHandler);
    this.createParticles();
    if (!this.animationFrame) {
      this.animate();
    }
  }

  resize() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    if (this.ctx) {
      this.ctx.resetTransform();
      this.ctx.scale(dpr, dpr);
    }
  }

  setTimeOfDay(time) {
    if (this.timeOfDay === time && this.particles.length > 0) return;
    this.timeOfDay = time;
    this.createParticles();
  }

  createParticles() {
    this.particles = [];
    const isMobile = window.innerWidth < 768;
    const isNight = (this.timeOfDay === 'night' || this.timeOfDay === 'midnight');

    if (isNight) {
      // ==========================================
      // NIGHT MODE: SOFT LUMINOUS GOLDEN LIGHT DEWS
      // Reduced count (9 on mobile, 14 on desktop)
      // Very slow, tranquil floating motion & breathing pulse
      // ==========================================
      const count = isMobile ? 9 : 14;

      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 3.5 + 2.5,
          speedY: Math.random() * 0.18 + 0.08, // Very gentle downward drift
          speedX: (Math.random() - 0.5) * 0.15, // Subtle breeze
          swayAmplitude: Math.random() * 0.8 + 0.35,
          swayFrequency: Math.random() * 0.008 + 0.004,
          swayPhase: Math.random() * Math.PI * 2,
          rotation: 0,
          rotationSpeed: 0,
          baseOpacity: Math.random() * 0.35 + 0.55,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.025 + 0.012, // Organic soft shimmer
          type: 'dew',
          petalCount: 0
        });
      }
    } else {
      // ==========================================
      // DAY MODE: AUTHENTIC SHIULI FLOWERS + KASH PHOOL
      // Elegant calibrated count (16 on mobile, 26 on desktop)
      // 25% calibrated slow gentle autumn flutter
      // ==========================================
      const count = isMobile ? 16 : 26;

      for (let i = 0; i < count; i++) {
        const rand = Math.random();
        let type = 'shiuli';
        if (rand > 0.8) type = 'sparkle';
        else if (rand > 0.7) type = 'kash';

        this.particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: type === 'shiuli' ? (Math.random() * 8 + 7) : (Math.random() * 5 + 3),
          speedY: type === 'sparkle' ? (Math.random() * 0.6 + 0.225) : (Math.random() * 0.9 + 0.375),
          speedX: (Math.random() - 0.5) * 0.45,
          swayAmplitude: Math.random() * 1.5 + 0.8,
          swayFrequency: Math.random() * 0.015 + 0.0075,
          swayPhase: Math.random() * Math.PI * 2,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.01875,
          baseOpacity: Math.random() * 0.45 + 0.55,
          pulsePhase: 0,
          pulseSpeed: 0,
          type: type,
          petalCount: 6
        });
      }
    }
  }

  animate() {
    if (!this.enabled || !this.ctx || !this.canvas) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    this.ctx.clearRect(0, 0, w, h);

    const isNight = this.timeOfDay === 'night' || this.timeOfDay === 'midnight';

    this.particles.forEach((p) => {
      // Physics & drift updates
      p.y += p.speedY;
      p.swayPhase += p.swayFrequency;
      p.x += p.speedX + Math.sin(p.swayPhase) * p.swayAmplitude;
      p.rotation += p.rotationSpeed;

      let currentOpacity = p.baseOpacity;
      if (p.type === 'dew') {
        p.pulsePhase += p.pulseSpeed;
        currentOpacity = Math.max(0.2, Math.min(1, p.baseOpacity + Math.sin(p.pulsePhase) * 0.28));
      }

      // Wrap around screen boundaries with margin
      if (p.y > h + 30) {
        p.y = -30;
        p.x = Math.random() * w;
      }
      if (p.x > w + 30) p.x = -30;
      if (p.x < -30) p.x = w + 30;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      if (p.rotation) {
        this.ctx.rotate(p.rotation);
      }
      this.ctx.globalAlpha = currentOpacity;

      if (p.type === 'dew') {
        // ==========================================
        // NIGHT LIGHT DEWS (SOFT LUMINOUS GOLDEN DEWDROPS)
        // Concentric radial glow with crystal highlight core
        // ==========================================
        const haloRadius = p.size * 2.7;
        const grad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, haloRadius);
        grad.addColorStop(0, 'rgba(255, 255, 240, 1)'); // Bright dew center
        grad.addColorStop(0.18, 'rgba(255, 230, 110, 0.92)'); // Golden warm liquid glow
        grad.addColorStop(0.48, 'rgba(255, 185, 45, 0.55)'); // Ambient gold illumination
        grad.addColorStop(0.78, 'rgba(255, 135, 20, 0.18)'); // Soft outer haze
        grad.addColorStop(1, 'rgba(255, 110, 0, 0)'); // Transparent falloff

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, haloRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Crystalline micro-specular point
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        this.ctx.beginPath();
        this.ctx.arc(-p.size * 0.28, -p.size * 0.28, p.size * 0.22, 0, Math.PI * 2);
        this.ctx.fill();

      } else if (p.type === 'shiuli') {
        // ==========================================
        // AUTHENTIC BENGALI SHIULI FLOWER
        // Pure white 6 petals with brilliant saffron-orange tube center
        // ==========================================
        const radius = p.size;
        const petalCount = p.petalCount || 6;

        // 1. Draw central bright saffron-orange star / stalk core
        this.ctx.beginPath();
        this.ctx.fillStyle = isNight ? '#ff7700' : '#ff5500';
        this.ctx.arc(0, 0, radius * 0.38, 0, Math.PI * 2);
        this.ctx.fill();

        // 2. Draw 6 radiating soft white petals
        for (let j = 0; j < petalCount; j++) {
          const angle = (j * Math.PI * 2) / petalCount;
          const px = Math.cos(angle) * (radius * 0.72);
          const py = Math.sin(angle) * (radius * 0.72);

          this.ctx.save();
          this.ctx.translate(px, py);
          this.ctx.rotate(angle);

          // Petal Gradient for realistic soft petal texture
          const petalGrad = this.ctx.createLinearGradient(-radius * 0.3, 0, radius * 0.6, 0);
          if (isNight) {
            petalGrad.addColorStop(0, '#ffa044'); // warm glow at inner root
            petalGrad.addColorStop(0.3, 'rgba(255, 250, 240, 0.95)');
            petalGrad.addColorStop(1, 'rgba(255, 255, 255, 0.85)');
          } else {
            petalGrad.addColorStop(0, '#ff6600'); // saffron root
            petalGrad.addColorStop(0.28, '#ffffff');
            petalGrad.addColorStop(1, '#fbfcfe');
          }

          this.ctx.fillStyle = petalGrad;
          this.ctx.beginPath();
          this.ctx.ellipse(0, 0, radius * 0.52, radius * 0.28, 0, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.restore();
        }

        // 3. Central pinhole dot
        this.ctx.beginPath();
        this.ctx.fillStyle = '#d84000';
        this.ctx.arc(0, 0, radius * 0.16, 0, Math.PI * 2);
        this.ctx.fill();

      } else if (p.type === 'sparkle') {
        // Glowing Golden Firefly / Diya Sparkle
        const grad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 1.5);
        grad.addColorStop(0, 'rgba(255, 250, 190, 1)');
        grad.addColorStop(0.35, 'rgba(255, 190, 50, 0.8)');
        grad.addColorStop(1, 'rgba(255, 140, 0, 0)');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size * 1.5, 0, Math.PI * 2);
        this.ctx.fill();

      } else if (p.type === 'kash') {
        // Kash Phool Soft Autumnal Feather Wisp
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, p.size * 1.6, p.size * 0.45, Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    });

    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.animate();
    } else {
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
      if (this.ctx) this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
    return this.enabled;
  }

  destroy() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    window.removeEventListener('resize', this.resizeHandler);
  }
}
