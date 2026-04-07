/**
 * drift-controller.js
 * Erstellt einen interaktiven Pointer-Parallax- und Idle-Float-Controller
 * für den Hero-Hintergrund.
 *
 * Verwendung:
 *   const drift = createDriftController({ stage, driftLayer, getState, sceneKeys, backgroundMap, backgroundLayers });
 *   drift.start();   // Pointer-Events + gsap.ticker aktivieren
 *   drift.stop();    // Alles wieder abräumen
 */

import { gsap } from "../../../public/vendor/gsap/index.js";
import { getSceneMotion } from "./scene-utils.js";

/**
 * @param {object}              options
 * @param {HTMLElement}         options.stage            - Stage-Element für Pointer-Events
 * @param {HTMLElement|null}    options.driftLayer       - Drift-Layer (kann null sein)
 * @param {() => { isTransitioning: boolean, activeIndex: number }} options.getState
 *                                                       - Live-Zugriff auf den aktuellen Scene-State
 * @param {string[]}            options.sceneKeys        - Geordnete Scene-Keys
 * @param {Map<string, HTMLElement>}   options.backgroundMap    - key → Background-Element
 * @param {Map<string, object>}        options.backgroundLayers - key → { wash, shapeA, shapeB, grid }
 */
export function createDriftController({
  stage,
  driftLayer,
  getState,
  sceneKeys,
  backgroundMap,
  backgroundLayers,
}) {
  // Geglätteter Pointer-State (interpoliert per Tick auf targetX/Y zu).
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;

  const handlePointerMove = (event) => {
    const rect = stage.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;

    targetX = Math.min(1, Math.max(-1, x));
    targetY = Math.min(1, Math.max(-1, y));
  };

  const handlePointerLeave = () => {
    targetX = 0;
    targetY = 0;
  };

  const tick = () => {
    // Smooth-Follow mit festem Lerp-Faktor 0.08.
    pointerX += (targetX - pointerX) * 0.08;
    pointerY += (targetY - pointerY) * 0.08;

    const time = performance.now() * 0.001;
    const driftX = Math.sin(time * 0.82) * 8 + pointerX * 26;
    const driftY = Math.cos(time * 0.9) * 6 + pointerY * 18;

    const { isTransitioning, activeIndex } = getState();
    const activeKey = sceneKeys[activeIndex];
    const activeMotion = getSceneMotion(activeKey);
    const activeBackground = backgroundMap.get(activeKey);
    const activeLayers = backgroundLayers.get(activeKey);

    // 3D-Drift-Layer bewegen.
    if (driftLayer) {
      driftLayer.style.transform =
        `translate3d(${driftX.toFixed(2)}px, ${driftY.toFixed(2)}px, 0) ` +
        `rotateX(${(-pointerY * 5).toFixed(3)}deg) rotateY(${(pointerX * 7).toFixed(3)}deg)`;
    }

    // CSS-Custom-Properties für Light-Position und Tilt-Effekte.
    stage.style.setProperty("--hero-light-x", `${(50 + pointerX * 9).toFixed(2)}%`);
    stage.style.setProperty("--hero-light-y", `${(25 + pointerY * 8).toFixed(2)}%`);
    stage.style.setProperty("--hero-drift-x", `${(pointerX * 22).toFixed(2)}px`);
    stage.style.setProperty("--hero-drift-y", `${(pointerY * 18).toFixed(2)}px`);
    stage.style.setProperty("--hero-tilt-x", (pointerY * -6).toFixed(3));
    stage.style.setProperty("--hero-tilt-y", (pointerX * 8).toFixed(3));

    // Hintergrund-Parallax nur wenn gerade keine Transition läuft.
    if (isTransitioning || !activeBackground || !activeLayers) return;

    gsap.set(activeBackground, {
      xPercent: pointerX * activeMotion.parallaxX * 0.18 + Math.sin(time * 0.22) * activeMotion.floatX * 0.08,
      yPercent: pointerY * activeMotion.parallaxY * 0.22 + Math.cos(time * 0.18) * activeMotion.floatY * 0.08,
      rotate: pointerX * 0.9,
    });

    gsap.set(activeLayers.wash, {
      xPercent: pointerX * activeMotion.parallaxX + Math.sin(time * 0.34) * activeMotion.floatX,
      yPercent: pointerY * activeMotion.parallaxY + Math.cos(time * 0.28) * activeMotion.floatY,
      scale: 1.04 + Math.sin(time * 0.24) * 0.015,
    });

    gsap.set(activeLayers.shapeA, {
      xPercent: pointerX * activeMotion.shapeAX * -0.36 + Math.sin(time * 0.3) * activeMotion.floatX * 0.42,
      yPercent: pointerY * activeMotion.shapeAY * 0.42 + Math.cos(time * 0.25) * activeMotion.floatY * 0.36,
      rotate: pointerX * activeMotion.shapeARotate * 0.16,
    });

    gsap.set(activeLayers.shapeB, {
      xPercent: pointerX * activeMotion.shapeBX * 0.32 + Math.cos(time * 0.32) * activeMotion.floatX * 0.34,
      yPercent: pointerY * activeMotion.shapeBY * 0.38 + Math.sin(time * 0.27) * activeMotion.floatY * 0.32,
      rotate: pointerX * activeMotion.shapeBRotate * 0.18,
    });

    gsap.set(activeLayers.grid, {
      xPercent: pointerX * activeMotion.gridX * 0.42,
      yPercent: pointerY * activeMotion.gridY * 0.42 + Math.cos(time * 0.22) * activeMotion.floatY * 0.24,
    });
  };

  return {
    start() {
      stage.addEventListener("pointermove", handlePointerMove);
      stage.addEventListener("pointerleave", handlePointerLeave);
      stage.addEventListener("pointercancel", handlePointerLeave);
      gsap.ticker.add(tick);
    },

    stop() {
      stage.removeEventListener("pointermove", handlePointerMove);
      stage.removeEventListener("pointerleave", handlePointerLeave);
      stage.removeEventListener("pointercancel", handlePointerLeave);
      gsap.ticker.remove(tick);
    },
  };
}
