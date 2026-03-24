import { initHexRevealBackground } from "./background/hex-reveal.js?v=1";
import { initLandingSceneScroll } from "./hero/landing-scene-scroll.js?v=7";
import { initLandingSceneSwitcher } from "./hero/landing-scene-switcher.js?v=5";
import { initLandingWarumWirScene } from "./three/landing-warum-wir-scene.js?v=3";
import { initWarumWirTechBraces } from "./three/warum-wir-tech-braces.js?v=4";
import { initSchablonenRoomScene } from "./three/schablonen-room-scene.js?v=1";
import { initWarumWirFlow } from "./background/warum-wir-flow.js?v=18";
import { initContactForm } from "./ui/contact-form.js";
import { initEstimator } from "./ui/estimator.js";
import { initMetrics } from "./ui/metrics.js";
import { initNav } from "./ui/nav.js";
import { initReveal } from "./ui/reveal.js";
import { initSceneSubpageChrome } from "./ui/scene-subpage-chrome.js?v=2";
import { initServiceChipPopovers } from "./ui/service-chip-popovers.js?v=1";
import { prefersReducedMotion } from "./utils/motion.js";

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
initLandingWarumWirScene({ reduceMotion });
initWarumWirTechBraces({ reduceMotion });
initSchablonenRoomScene({ reduceMotion });
initWarumWirFlow({ reduceMotion });
