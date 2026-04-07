import { initHexRevealBackground } from "./background/hex-reveal.js?v=1";
import { initLandingSceneScroll } from "./hero/landing-scene-scroll.js?v=7";
import { initLandingSceneSwitcher } from "./hero/landing-scene-switcher.js?v=5";
import { initLandingWarumWirScene } from "./three/landing-warum-wir-scene.js?v=3";
import { initWarumWirTechBraces } from "./three/warum-wir-tech-braces.js?v=4";
import { initSchablonenRoomScene } from "./three/schablonen-room-scene.js?v=1";
import { initWarumWirFlow } from "./background/warum-wir-flow.js?v=23";
import { initContactForm } from "./ui/contact-form.js";
import { initEstimator } from "./ui/estimator.js";
import { initMetrics } from "./ui/metrics.js";
import { initNav } from "./ui/nav.js";
import { initReveal } from "./ui/reveal.js";
import { initSceneSubpageChrome } from "./ui/scene-subpage-chrome.js?v=2";
import { initServiceChipPopovers } from "./ui/service-chip-popovers.js?v=1";
import { prefersReducedMotion } from "./utils/motion.js";
import { showToast } from "./ui/toast.js";

// ── WebGL-Verfügbarkeit prüfen ───────────────────────────────────────────────
function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

const webGLAvailable = supportsWebGL();

if (!webGLAvailable) {
  document.body.dataset.webglUnavailable = "true";
  showToast(
    "Dein Browser unterstützt kein WebGL — 3D-Elemente werden ausgeblendet.",
    { type: "warning", duration: 0 },
  );
}

// ── App initialisieren ───────────────────────────────────────────────────────

const reduceMotion = prefersReducedMotion();
const isWarumWirSubpage = document.body?.classList.contains("is-scene-subpage--warum-wir");

const yearTarget = document.getElementById("year");

if (yearTarget) {
  yearTarget.textContent = String(new Date().getFullYear());
}

if (!isWarumWirSubpage) {
  initHexRevealBackground({ reduceMotion });
}
initSceneSubpageChrome();
initNav();
initReveal({ reduceMotion });
initServiceChipPopovers();
initMetrics({ reduceMotion });
initEstimator();
initContactForm();
initLandingSceneSwitcher({ reduceMotion });
initLandingSceneScroll({ reduceMotion });

// 3D-Szenen nur starten wenn WebGL verfügbar ist
if (webGLAvailable) {
  initLandingWarumWirScene({ reduceMotion });
  initWarumWirTechBraces({ reduceMotion });
  initSchablonenRoomScene({ reduceMotion });
}

initWarumWirFlow({ reduceMotion });
