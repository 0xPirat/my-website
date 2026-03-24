import {
  SCENE_TRANSITION_STORAGE_KEY,
  buildSceneLandingUrl,
  getScenePage,
} from "../config/scene-pages.js";

function getSceneKey() {
  return document.body?.dataset.scenePage || "warum-wir";
}

const LANDING_HOME_URL = "index.html#landing-top";

function renderHeader(sceneKey) {
  return `
    <nav class="scene-subpage-header__inner" aria-label="Unterseiten Kopfbereich">
      <a class="scene-subpage-link scene-subpage-link--back" href="${buildSceneLandingUrl(sceneKey)}">
        <span class="scene-subpage-link__icon scene-subpage-link__icon--back" aria-hidden="true">↖</span>
        <span class="scene-subpage-link__label" data-scroll-glint data-text="Zurueck zum Auge">Zurueck zum Auge</span>
      </a>

      <a class="scene-subpage-header__brand" href="${LANDING_HOME_URL}" aria-label="buildIT Startseite">
        <span class="scene-subpage-header__brand-mark" aria-hidden="true"></span>
      </a>

      <a class="scene-subpage-link scene-subpage-link--cta" href="contact.html">
        <span class="scene-subpage-link__label" data-scroll-glint data-text="Projekt anfragen">Projekt anfragen</span>
        <span class="scene-subpage-link__icon scene-subpage-link__icon--cta" aria-hidden="true">↗</span>
      </a>
    </nav>
  `;
}

function renderFooter() {
  return `
    <div class="scene-subpage-footer__inner">
      <a class="scene-subpage-footer__brand" href="${LANDING_HOME_URL}" aria-label="buildIT Startseite">
        <span class="scene-subpage-footer__brand-mark" aria-hidden="true"></span>
        <span class="scene-subpage-footer__brand-text">buildIT</span>
      </a>

      <div class="scene-subpage-footer__meta">
        <nav class="scene-subpage-footer__links" aria-label="Footer Links">
          <a href="impressum.html">Impressum</a>
          <a href="datenschutz.html">Datenschutz</a>
          <a href="contact.html">Kontakt</a>
        </nav>
      </div>
    </div>
  `;
}

function initSceneSubpageArrival(sceneKey) {
  const body = document.body;

  if (!body || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  let transitionScene = null;

  try {
    transitionScene = window.sessionStorage.getItem(SCENE_TRANSITION_STORAGE_KEY);
    window.sessionStorage.removeItem(SCENE_TRANSITION_STORAGE_KEY);
  } catch (error) {
    transitionScene = null;
  }

  if (transitionScene !== sceneKey) {
    return;
  }

  body.classList.add("is-scene-arriving");

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      body.classList.add("is-scene-arrival-ready");
    });
  });

  window.setTimeout(() => {
    body.classList.remove("is-scene-arriving");
    body.classList.remove("is-scene-arrival-ready");
  }, 1200);
}

function initSceneSubpageScrollGlint() {
  const labels = Array.from(document.querySelectorAll("[data-scroll-glint]"));

  if (
    labels.length === 0 ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  let clearTimer = 0;
  let frameHandle = 0;
  let lastScrollY = window.scrollY;
  let lastGlintAt = -Infinity;

  function triggerGlint() {
    labels.forEach((label) => {
      label.classList.remove("is-scroll-glinting");
      void label.offsetWidth;
      label.classList.add("is-scroll-glinting");
    });

    window.clearTimeout(clearTimer);
    clearTimer = window.setTimeout(() => {
      labels.forEach((label) => {
        label.classList.remove("is-scroll-glinting");
      });
    }, 720);
  }

  function handleScroll() {
    if (frameHandle) {
      return;
    }

    frameHandle = window.requestAnimationFrame(() => {
      frameHandle = 0;

      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY + 2;

      lastScrollY = currentScrollY;

      if (!isScrollingDown) {
        return;
      }

      const now = window.performance.now();

      if (now - lastGlintAt < 260) {
        return;
      }

      lastGlintAt = now;
      triggerGlint();
    });
  }

  window.addEventListener("scroll", handleScroll, { passive: true });
}

function initSceneSubpageHoverGlint() {
  const labels = Array.from(document.querySelectorAll("[data-scroll-glint]"));

  if (
    labels.length === 0 ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  labels.forEach((label) => {
    const trigger = label.closest(".scene-subpage-link");

    if (!trigger) {
      return;
    }

    let hoverCount = 0;
    let clearTimer = 0;

    function runGlint() {
      label.classList.remove("is-hover-glinting");
      void label.offsetWidth;
      label.classList.add("is-hover-glinting");

      window.clearTimeout(clearTimer);
      clearTimer = window.setTimeout(() => {
        label.classList.remove("is-hover-glinting");
      }, 720);
    }

    function handleIntent() {
      hoverCount += 1;

      if (hoverCount % 3 !== 0) {
        return;
      }

      runGlint();
    }

    trigger.addEventListener("pointerenter", handleIntent);
    trigger.addEventListener("focus", handleIntent);
  });
}

export function initSceneSubpageChrome() {
  const body = document.body;

  if (!body?.classList.contains("is-scene-subpage")) {
    return;
  }

  const scene = getScenePage(getSceneKey());
  const headerMount = document.querySelector("[data-scene-subpage-header]");
  const footerMount = document.querySelector("[data-scene-subpage-footer]");

  if (headerMount && !headerMount.hasChildNodes()) {
    headerMount.innerHTML = renderHeader(scene.key);
  }

  if (footerMount && !footerMount.hasChildNodes()) {
    footerMount.innerHTML = renderFooter();
  }

  initSceneSubpageArrival(scene.key);

  if (scene.key !== "warum-wir") {
    initSceneSubpageScrollGlint();
    initSceneSubpageHoverGlint();
  }
}
