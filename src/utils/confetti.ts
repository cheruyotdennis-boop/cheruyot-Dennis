/**
 * Safe Confetti Utility for Quantiq Prime
 * Gracefully handles sandboxed iframes and environments where Web Workers / OffscreenCanvas
 * might throw Illegal constructor or SecurityError.
 */

export function triggerConfetti(opts?: {
  particleCount?: number;
  spread?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
}) {
  try {
    const count = opts?.particleCount || 60;
    const originY = opts?.origin?.y ?? 0.6;
    const originX = opts?.origin?.x ?? 0.5;
    const colors = opts?.colors || ['#F59E0B', '#10B981', '#FDE047', '#E2E8F0', '#D97706'];

    // Create a temporary canvas directly in document without workers
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      if (document.body.contains(canvas)) document.body.removeChild(canvas);
      return;
    }

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      rotation: number;
      rotationSpeed: number;
      decay: number;
    }

    const particles: Particle[] = [];
    const startX = canvas.width * originX;
    const startY = canvas.height * originY;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI / 180) * (270 + (Math.random() * (opts?.spread || 70) - (opts?.spread || 70) / 2));
      const speed = Math.random() * 12 + 6;
      particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        decay: Math.random() * 0.015 + 0.012
      });
    }

    let animationFrame: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let aliveCount = 0;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.98; // friction
        p.alpha -= p.decay;
        p.rotation += p.rotationSpeed;

        if (p.alpha > 0) {
          aliveCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      }

      if (aliveCount > 0) {
        animationFrame = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animationFrame);
        if (document.body.contains(canvas)) {
          document.body.removeChild(canvas);
        }
      }
    };

    animationFrame = requestAnimationFrame(render);
  } catch (e) {
    console.warn('Confetti animation suppressed:', e);
  }
}
