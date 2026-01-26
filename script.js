const reveals = document.querySelectorAll('.reveal');
const matrixIntro = document.querySelector('.matrix-intro');
const matrixCanvas = document.getElementById('matrix-canvas');
const heroStage = document.querySelector('[data-parallax]');
const heroTitle = document.querySelector('.hero-title');
const siteSpotlight = document.querySelector('.site-spotlight');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const glassCards = document.querySelectorAll('.service-card, .step, .proof-card');

const matrixChars = ['0', '1'];
let matrixAnimationId = null;
let matrixActive = false;

glassCards.forEach((card) => {
  const edge = document.createElement('span');
  edge.className = 'glass-edge';
  card.appendChild(edge);
});

function sizeCanvas(canvas) {
  const { innerWidth: width, innerHeight: height } = window;
  canvas.width = Math.floor(width * window.devicePixelRatio);
  canvas.height = Math.floor(height * window.devicePixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}

function startMatrixRain() {
  if (!matrixCanvas) return;
  const ctx = matrixCanvas.getContext('2d');
  sizeCanvas(matrixCanvas);

  const fontSize = 4.5 * window.devicePixelRatio;
  const columns = Math.floor(matrixCanvas.width / fontSize);
  const drops = Array.from(
    { length: columns },
    () => Math.random() * (matrixCanvas.height / fontSize)
  );
  matrixActive = true;

  function draw() {
    if (!matrixActive) return;
    ctx.fillStyle = 'rgba(2, 3, 4, 0.06)';
    ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    ctx.font = `${fontSize}px "Space Grotesk", monospace`;

    for (let i = 0; i < drops.length; i += 1) {
      const x = i * fontSize;
      const y = drops[i] * fontSize;
      const alpha = Math.random() * 0.45 + 0.45;
      ctx.fillStyle = `rgba(24, 255, 116, ${alpha})`;
      ctx.fillText(matrixChars[Math.floor(Math.random() * matrixChars.length)], x, y);
      ctx.fillText(
        matrixChars[Math.floor(Math.random() * matrixChars.length)],
        x,
        y + fontSize * 0.8
      );
      ctx.fillText(
        matrixChars[Math.floor(Math.random() * matrixChars.length)],
        x,
        y + fontSize * 1.6
      );
      ctx.fillText(
        matrixChars[Math.floor(Math.random() * matrixChars.length)],
        x,
        y + fontSize * 2.4
      );
      if (y > matrixCanvas.height + fontSize * 2.4) {
        drops[i] = 0;
      }
      drops[i] += 3.1;
    }
    matrixAnimationId = requestAnimationFrame(draw);
  }

  draw();
}

function stopMatrixRain() {
  matrixActive = false;
  if (matrixAnimationId) cancelAnimationFrame(matrixAnimationId);
}

function finishIntro() {
  document.body.classList.add('intro-complete');
  document.body.classList.remove('intro-active');
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  if (heroTitle) {
    heroTitle.classList.add('shake');
    setTimeout(() => {
      heroTitle.classList.remove('shake');
    }, 900);
  }
  if (matrixIntro) {
    matrixIntro.classList.add('fade-out');
    setTimeout(() => {
      stopMatrixRain();
    }, 600);
  }
}

if (prefersReducedMotion) {
  document.body.classList.add('no-intro');
  if (matrixIntro) matrixIntro.style.display = 'none';
} else {
  document.body.classList.add('intro-active');
  startMatrixRain();
  const glitchDelay = 1400;
  setTimeout(() => {
    if (matrixIntro) matrixIntro.classList.add('glitch');
  }, glitchDelay);
  setTimeout(() => {
    document.body.classList.add('curtain-on');
  }, 1700);
  setTimeout(finishIntro, 1600);
  window.addEventListener('resize', () => {
    if (!matrixActive) return;
    stopMatrixRain();
    startMatrixRain();
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

reveals.forEach((el) => observer.observe(el));

const parallaxLayers = heroStage ? heroStage.querySelectorAll('[data-depth]') : [];
let parallaxRaf = null;
let spotlightRaf = null;

function handleParallax(event) {
  if (!heroStage || prefersReducedMotion) return;
  const rect = heroStage.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;

  if (parallaxRaf) cancelAnimationFrame(parallaxRaf);
  parallaxRaf = requestAnimationFrame(() => {
    parallaxLayers.forEach((layer) => {
      const depth = Number(layer.dataset.depth) || 0.2;
      const translateX = x * 52 * depth;
      const translateY = y * 40 * depth;
      const rotateX = y * -10 * depth;
      const rotateY = x * 12 * depth;
      layer.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
  });
}

function resetParallax() {
  parallaxLayers.forEach((layer) => {
    layer.style.transform = 'translate3d(0, 0, 0)';
  });
}

if (heroStage && !prefersReducedMotion) {
  heroStage.addEventListener('mousemove', handleParallax);
  heroStage.addEventListener('mouseleave', resetParallax);
}

function handleSpotlight(event) {
  if (!siteSpotlight || prefersReducedMotion) return;
  if (!document.body.classList.contains('intro-complete')) return;
  const x = (event.clientX / window.innerWidth) * 100;
  const y = (event.clientY / window.innerHeight) * 100;

  if (spotlightRaf) cancelAnimationFrame(spotlightRaf);
  spotlightRaf = requestAnimationFrame(() => {
    document.body.style.setProperty('--spot-x', `${x}%`);
    document.body.style.setProperty('--spot-y', `${y}%`);
    siteSpotlight.classList.add('spot-on');
  });
}

function resetSpotlight() {
  if (!siteSpotlight) return;
  siteSpotlight.classList.remove('spot-on');
}

if (siteSpotlight && !prefersReducedMotion) {
  window.addEventListener('mousemove', handleSpotlight);
  window.addEventListener('mouseleave', resetSpotlight);
}
