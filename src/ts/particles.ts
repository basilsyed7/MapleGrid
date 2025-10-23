export interface ParticleOptions {
  canvas: HTMLCanvasElement;
  themeColors: {
    particle: string;
    accent: string;
  };
  mapleLeafCount?: number;
  density?: number;
  exclusionZones?: ExclusionZone[];
}

export interface ExclusionZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  isMapleLeaf: boolean;
  rotation: number;
  rotationSpeed: number;
  driftAngle: number;
  driftSpeed: number;
  returnSpeed: number;
  noiseOffset: number;
  twinkleSpeed: number;
  color: string;
}

export interface ParticleHandle {
  init: () => void;
  destroy: () => void;
  pause: () => void;
  resume: () => void;
  updateDensity: (density: number) => void;
  setExclusionZones: (zones: ExclusionZone[]) => void;
}

const MAPLE_LEAF_PATH = new Path2D(
  'M0 -20 L4 -6 L19 -8 L8 4 L13 19 L0 10 L-13 19 L-8 4 L-19 -8 L-4 -6 Z'
);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const createGalaxyPosition = (width: number, height: number) => {
  const angle = Math.random() * Math.PI * 2;
  const radiusFactor = Math.pow(Math.random(), 0.62);
  const ellipseX = Math.cos(angle) * radiusFactor * (width * 0.46);
  const ellipseY = Math.sin(angle) * radiusFactor * (height * 0.34);
  const jitterX = (Math.random() - 0.5) * width * 0.06;
  const jitterY = (Math.random() - 0.5) * height * 0.06;
  const x = width / 2 + ellipseX + jitterX;
  const y = height / 2 + ellipseY + jitterY;
  return {
    x: clamp(x, -40, width + 40),
    y: clamp(y, -40, height + 40)
  };
};

export const initParticles = (options: ParticleOptions): ParticleHandle => {
  const { canvas, themeColors } = options;
  const context = canvas.getContext('2d');

  if (!context) {
    return {
      init: () => undefined,
      destroy: () => undefined,
      pause: () => undefined,
      resume: () => undefined,
      updateDensity: () => undefined,
      setExclusionZones: () => undefined
    };
  }

  const particles: Particle[] = [];
  const pointer = { x: 0, y: 0, active: false };
  let exclusionZones: ExclusionZone[] = options.exclusionZones ?? [];
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  let animationFrame = 0;
  let running = false;
  let width = canvas.clientWidth;
  let height = canvas.clientHeight;

  const cleanupFns: Array<() => void> = [];
  let lastFrameTime = 0;
  const frameInterval = 1000 / 30;

  const isInExclusionZone = (x: number, y: number) =>
    exclusionZones.some(
      (zone) => x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height
    );

  const computeCounts = () => {
    const baseDensity = options.density ?? 260;
    const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
    const total = Math.max(140, Math.round(isSmallScreen ? baseDensity * 0.38 : baseDensity));
    const mapleLeaves = Math.min(options.mapleLeafCount ?? Math.round(total * 0.08), total - 10);
    return { total, mapleLeaves };
  };

  const resizeCanvas = () => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(width * ratio));
    canvas.height = Math.max(1, Math.floor(height * ratio));
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(ratio, ratio);
  };

  const seedParticles = () => {
    particles.length = 0;
    const { total, mapleLeaves } = computeCounts();
    for (let i = 0; i < total; i += 1) {
      const isLeaf = i < mapleLeaves;
      const useGalaxyDistribution = !isLeaf && Math.random() < 0.8;
      const position = useGalaxyDistribution
        ? createGalaxyPosition(width, height)
        : {
            x: Math.random() * width,
            y: Math.random() * height
          };
      const baseX = position.x;
      const baseY = position.y;
      const scaleRoll = Math.random();
      let radius = 0.55 + Math.random() * 0.5;
      if (scaleRoll < 0.28) {
        radius = 0.32 + Math.random() * 0.22;
      } else if (scaleRoll > 0.9) {
        radius = 0.95 + Math.random() * 0.25;
      }
      const particle: Particle = {
        x: baseX,
        y: baseY,
        baseX,
        baseY,
        vx: 0,
        vy: 0,
        radius: isLeaf ? 12 + Math.random() * 12 : radius,
        isMapleLeaf: isLeaf,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: isLeaf ? (Math.random() * 0.008 - 0.004) : 0,
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: isLeaf ? 0.1 + Math.random() * 0.06 : 0.018 + Math.random() * 0.028,
        returnSpeed: isLeaf ? 0.02 : 0.024,
        noiseOffset: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.0015 + Math.random() * 0.0025,
        color: isLeaf ? themeColors.accent : themeColors.particle
      };
      particles.push(particle);
    }
  };

  const applyPointerForce = (particle: Particle, radius: number) => {
    if (!pointer.active) {
      return;
    }
    if (isInExclusionZone(particle.baseX, particle.baseY)) {
      return;
    }
    const dx = pointer.x - particle.x;
    const dy = pointer.y - particle.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    if (distance > radius) {
      return;
    }
    const force = (radius - distance) / radius;
    const strength = Math.min(0.9, force * 0.75);
    particle.vx -= (dx / distance) * strength;
    particle.vy -= (dy / distance) * strength;
  };

  const renderFrame = () => {
    if (!running) {
      return;
    }

    const now = performance.now();
    if (now - lastFrameTime < frameInterval) {
      animationFrame = window.requestAnimationFrame(renderFrame);
      return;
    }
    lastFrameTime = now;

    context.clearRect(0, 0, width, height);
    const pointerRadius = Math.min(width, height) * 0.65;

    particles.forEach((particle) => {
      applyPointerForce(particle, pointerRadius);

      particle.driftAngle += 0.0025;
      particle.vx *= 0.92;
      particle.vy *= 0.92;
      particle.x += particle.vx + Math.cos(particle.driftAngle) * particle.driftSpeed;
      particle.y += particle.vy + Math.sin(particle.driftAngle * 0.5) * particle.driftSpeed;
      particle.x += (particle.baseX - particle.x) * particle.returnSpeed;
      particle.y += (particle.baseY - particle.y) * particle.returnSpeed;

      if (particle.isMapleLeaf) {
        particle.rotation += particle.rotationSpeed;
        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        const scale = particle.radius / 20;
        context.scale(scale, scale);
        context.fillStyle = particle.color;
        context.globalAlpha = 0.7;
        context.fill(MAPLE_LEAF_PATH);
        context.restore();
      } else {
        const twinkle = 0.55 + Math.sin(now * particle.twinkleSpeed + particle.noiseOffset) * 0.45;
        const alpha = clamp(0.28 + twinkle * 0.6, 0.18, 0.95);
        context.fillStyle = particle.color;
        context.globalAlpha = alpha;

        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();

        if (particle.radius <= 0.55) {
          context.beginPath();
          context.globalAlpha = alpha * 0.75;
          context.arc(particle.x, particle.y, Math.max(0.7, particle.radius * 1.6), 0, Math.PI * 2);
          context.fill();
        }
      }
    });

    context.globalAlpha = 1;
    animationFrame = window.requestAnimationFrame(renderFrame);
  };

  const stop = () => {
    if (!running) {
      return;
    }
    running = false;
    window.cancelAnimationFrame(animationFrame);
  };

  const start = () => {
    if (running || reduceMotionQuery.matches) {
      return;
    }
    running = true;
    lastFrameTime = 0;
    animationFrame = window.requestAnimationFrame(renderFrame);
  };

  const drawStatic = () => {
    context.clearRect(0, 0, width, height);
    particles.slice(0, 28).forEach((particle) => {
      context.fillStyle = particle.color;
      context.globalAlpha = particle.isMapleLeaf ? 0.35 : 0.32;
      context.beginPath();
      context.arc(
        particle.baseX,
        particle.baseY,
        particle.isMapleLeaf ? particle.radius : Math.max(0.7, particle.radius * 1.4),
        0,
        Math.PI * 2
      );
      context.fill();
    });
    context.globalAlpha = 1;
  };

  const handlePreferenceChange = () => {
    if (reduceMotionQuery.matches) {
      stop();
      drawStatic();
    } else {
      start();
    }
  };

  const handlePointerMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const withinBounds =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!withinBounds) {
      pointer.active = false;
      return;
    }

    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  };

  const handlePointerLeave = () => {
    pointer.active = false;
  };

  const onResize = () => {
    const wasRunning = running;
    stop();
    resizeCanvas();
    seedParticles();
    if (wasRunning && !reduceMotionQuery.matches) {
      start();
    } else if (reduceMotionQuery.matches) {
      drawStatic();
    }
  };

  const init = () => {
    resizeCanvas();
    seedParticles();
    handlePreferenceChange();
  };

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerdown', handlePointerMove);
  window.addEventListener('pointerleave', handlePointerLeave);
  window.addEventListener('pointerout', handlePointerLeave);
  window.addEventListener('resize', onResize);
  reduceMotionQuery.addEventListener('change', handlePreferenceChange);

  cleanupFns.push(() => window.removeEventListener('pointermove', handlePointerMove));
  cleanupFns.push(() => window.removeEventListener('pointerdown', handlePointerMove));
  cleanupFns.push(() => window.removeEventListener('pointerleave', handlePointerLeave));
  cleanupFns.push(() => window.removeEventListener('pointerout', handlePointerLeave));
  cleanupFns.push(() => window.removeEventListener('resize', onResize));
  cleanupFns.push(() => reduceMotionQuery.removeEventListener('change', handlePreferenceChange));

  return {
    init,
    destroy: () => {
      stop();
      cleanupFns.forEach((fn) => fn());
      particles.length = 0;
      context.clearRect(0, 0, width, height);
    },
    pause: stop,
    resume: start,
    updateDensity: (density: number) => {
      options.density = density;
      seedParticles();
    },
    setExclusionZones: (zones: ExclusionZone[]) => {
      exclusionZones = zones;
      if (particles.length > 0) {
        seedParticles();
      }
    }
  };
};

export const destroyParticles = (handle?: ParticleHandle): void => {
  handle?.destroy();
};
