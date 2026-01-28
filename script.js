const reveals = document.querySelectorAll('.reveal');
const matrixIntro = document.querySelector('.matrix-intro');
const matrixCanvas = document.getElementById('matrix-canvas');
const heroStage = document.querySelector('[data-parallax]');
const heroTitle = document.querySelector('.hero-title');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isApproachPage = document.body.classList.contains('approach-page');
const skipIntro = document.body.classList.contains('no-intro');
const glassCards = document.querySelectorAll('.service-card, .step, .proof-card');
const linkButtons = document.querySelectorAll('[data-link]');

const matrixChars = ['0', '1'];
let matrixAnimationId = null;
let matrixActive = false;

glassCards.forEach((card) => {
  const edge = document.createElement('span');
  edge.className = 'glass-edge';
  card.appendChild(edge);
});

linkButtons.forEach((button) => {
  button.addEventListener('click', (event) => {
    const target = button.dataset.link;
    if (!target) return;
    const duration = Number(button.dataset.duration) || 520;
    if (prefersReducedMotion || !matrixIntro || !matrixCanvas) {
      window.location.href = target;
      return;
    }

    event.preventDefault();
    matrixIntro.classList.remove('fade-out');
    matrixIntro.classList.add('glitch');
    stopMatrixRain();
    startMatrixRain();

    setTimeout(() => {
      matrixIntro.classList.remove('glitch');
    }, 220);

    setTimeout(() => {
      window.location.href = target;
    }, duration);
  });
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

function finishIntro(fadeDelay = 600) {
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
    }, fadeDelay);
  }
  if (typeof startHeroSlideshow === 'function') {
    startHeroSlideshow();
  }
}

if (prefersReducedMotion || skipIntro) {
  document.body.classList.add('no-intro');
  if (matrixIntro) matrixIntro.classList.add('fade-out');
} else {
  document.body.classList.add('intro-active');
  startMatrixRain();
  const glitchDelay = isApproachPage ? 520 : 1400;
  const curtainDelay = isApproachPage ? 680 : 1700;
  const finishDelay = isApproachPage ? 720 : 1600;
  const fadeDelay = isApproachPage ? 320 : 600;
  setTimeout(() => {
    if (matrixIntro) matrixIntro.classList.add('glitch');
  }, glitchDelay);
  setTimeout(() => {
    document.body.classList.add('curtain-on');
  }, curtainDelay);
  setTimeout(() => {
    finishIntro(fadeDelay);
  }, finishDelay);
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

// Parallax removed per request: no cursor-driven motion on hero content.

window.addEventListener('pageshow', (event) => {
  const navEntry = performance.getEntriesByType('navigation')[0];
  const isBackForward = event.persisted || navEntry?.type === 'back_forward';
  if (!isBackForward) return;
  document.body.classList.add('intro-complete');
  document.body.classList.remove('intro-active');
  document.body.classList.remove('curtain-on');
  if (matrixIntro) {
    matrixIntro.classList.add('fade-out');
    matrixIntro.classList.remove('glitch');
  }
  stopMatrixRain();
});
