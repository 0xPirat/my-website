const reveals = document.querySelectorAll('.reveal');
const heroStage = document.querySelector('[data-parallax]');
const glassCards = document.querySelectorAll('.service-card, .step, .proof-card');
const linkButtons = document.querySelectorAll('[data-link]');

glassCards.forEach((card) => {
  const edge = document.createElement('span');
  edge.className = 'glass-edge';
  card.appendChild(edge);
});

linkButtons.forEach((button) => {
  button.addEventListener('click', (event) => {
    const target = button.dataset.link;
    if (!target) return;
    event.preventDefault();
    window.location.href = target;
  });
});

document.body.classList.add('no-intro', 'intro-complete');
document.body.classList.remove('intro-active', 'curtain-on');
window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
if (typeof startHeroSlideshow === 'function') {
  startHeroSlideshow();
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
  document.body.classList.add('no-intro', 'intro-complete');
  document.body.classList.remove('intro-active', 'curtain-on');
});
