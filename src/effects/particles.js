// Atmospheric Particles: Falling Shiuli Flowers, Golden Sparkles & Floating Kash Phool

export class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.animationFrame = null;
    this.enabled = true;
    this.timeOfDay = 'morning';
    this.resizeHandler = this.resize.bind(this);
  }

  init() {
    if (!this.canvas) return;
    this.resize();
    window.addEventListener('resize', this.resizeHandler);
    this.createParticles();
    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setTimeOfDay(time) {
    this.timeOfDay = time;
    this.createParticles();
  }

  createParticles() {
    this.particles = [];
    const count = window.innerWidth < 768 ? 24 : 45;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 8 + 6,
        speedY: Math.random() * 1.2 + 0.4,
        speedX: (Math.random() - 0.5) * 0.8,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03,
        opacity: Math.random() * 0.7 + 0.3,
        petalColor: this.timeOfDay === 'night' || this.timeOfDay === 'midnight' ? '#ffd700' : '#ffffff',
        stalkColor: '#ff6600', // Traditional Shiuli orange stem
        type: (this.timeOfDay === 'night' || this.timeOfDay === 'midnight') ? 'sparkle' : 'shiuli'
      });
    }
  }

  animate() {
    if (!this.enabled || !this.ctx) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((p) => {
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(p.y * 0.01) * 0.3;
      p.rotation += p.rotationSpeed;

      if (p.y > this.canvas.height + 20) {
        p.y = -20;
        p.x = Math.random() * this.canvas.width;
      }
      if (p.x > this.canvas.width + 20) p.x = -20;
      if (p.x < -20) p.x = this.canvas.width + 20;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.globalAlpha = p.opacity;

      if (p.type === 'sparkle') {
        // Glowing Golden Firefly / Diya Sparkle
        const grad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
        grad.addColorStop(0, 'rgba(255, 245, 180, 1)');
        grad.addColorStop(0.4, 'rgba(255, 180, 50, 0.7)');
        grad.addColorStop(1, 'rgba(255, 140, 0, 0)');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // Authentic Shiuli Flower (White 6 petals + bright orange tube center)
        const petalCount = 6;
        const radius = p.size;

        // Draw orange central stalk/core
        this.ctx.fillStyle = '#ff6b00';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw white petals
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        for (let j = 0; j < petalCount; j++) {
          const angle = (j * Math.PI * 2) / petalCount;
          const px = Math.cos(angle) * (radius * 0.7);
          const py = Math.sin(angle) * (radius * 0.7);

          this.ctx.beginPath();
          this.ctx.ellipse(px, py, radius * 0.45, radius * 0.25, angle, 0, Math.PI * 2);
          this.ctx.fill();
        }
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
      cancelAnimationFrame(this.animationFrame);
      if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    return this.enabled;
  }

  destroy() {
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.resizeHandler);
  }
}
