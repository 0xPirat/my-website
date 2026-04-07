/**
 * scene-state.js
 * GSAP-gestützte DOM-State-Funktionen für den Landing-Scene-Switcher.
 * Schreibt den sichtbaren Zustand von Panels, Backgrounds, Progress-Scenes und Controls.
 */

import { gsap } from "../../../public/vendor/gsap/index.js";
import { getPanelBaseOffset, buildPanelState } from "./scene-utils.js";

// ── Layer-Helpers (null-safe GSAP-Wrapper) ────────────────────────────────────

/** Setzt GSAP-Props auf einem einzelnen Layer — wird ignoriert wenn layer null ist. */
export function setLayer(layer, props) {
  if (!layer) return;
  gsap.set(layer, props);
}

/** Tweent einen Layer auf einer Timeline — wird ignoriert wenn layer null ist. */
export function animateLayer(timeline, layer, props, position) {
  if (!layer) return;
  timeline.to(layer, props, position);
}

/** Setzt alle Background-Layer auf ihren Ausgangszustand zurück. */
export function resetBackgroundLayers(layers) {
  const items = [layers.wash, layers.shapeA, layers.shapeB, layers.grid].filter(Boolean);

  if (!items.length) return;

  gsap.set(items, {
    xPercent: 0,
    yPercent: 0,
    rotate: 0,
    scale: 1,
    opacity: 1,
    filter: "blur(0px)",
  });
}

/** Löscht alle GSAP-Transforms von den Progress-Scene-Layern. */
export function resetProgressLayers(layers) {
  const items = [
    layers.halo,
    layers.beam,
    layers.portal,
    layers.lead,
    layers.mid,
    layers.tail,
    layers.caption,
  ].filter(Boolean);

  if (!items.length) return;

  gsap.set(items, { clearProps: "transform,opacity,filter" });
}

// ── Control-State ─────────────────────────────────────────────────────────────

/**
 * Setzt den aktiven/inaktiven Zustand eines Navigation-Controls.
 * Unterstützt role="tab" (aria-selected) und Links (aria-current).
 */
export function setControlState(control, active) {
  control.classList.toggle("is-active", active);

  if (control.getAttribute("role") === "tab") {
    control.setAttribute("aria-selected", String(active));
    control.tabIndex = active ? 0 : -1;
    return;
  }

  if (active) {
    control.setAttribute("aria-current", "location");
    return;
  }

  control.removeAttribute("aria-current");
}

// ── Scene-Snapshot ────────────────────────────────────────────────────────────

/**
 * Setzt alle Panels, Backgrounds, Progress-Scenes und Controls
 * sofort auf den finalen Zustand der angegebenen Scene (kein Tween).
 * Wird nach jeder abgeschlossenen Transition aufgerufen.
 */
export function setSceneState({ root, panels, backgrounds, progressScenes, controls, key }) {
  root.dataset.scene = key;

  panels.forEach((panel) => {
    const active = panel.dataset.scenePanel === key;
    const baseOffset = getPanelBaseOffset(panel);
    panel.classList.toggle("is-active", active);
    gsap.set(panel, buildPanelState(panel, {
      autoAlpha: active ? 1 : 0,
      x: active ? baseOffset.x : baseOffset.x + 48,
      y: baseOffset.y,
      filter: active ? "blur(0px)" : "blur(10px)",
      zIndex: active ? 2 : 0,
    }));
  });

  backgrounds.forEach((background) => {
    const active = background.dataset.sceneBg === key;
    background.classList.toggle("is-active", active);
    gsap.set(background, {
      autoAlpha: active ? 1 : 0,
      xPercent: 0,
      yPercent: 0,
      rotate: 0,
      scale: 1,
      filter: "blur(0px) brightness(1) saturate(1)",
      zIndex: active ? 1 : 0,
    });
  });

  progressScenes.forEach((progressScene) => {
    const active = progressScene.dataset.sceneProgress === key;
    progressScene.classList.toggle("is-active", active);
    gsap.set(progressScene, {
      autoAlpha: active ? 1 : 0,
      x: 0,
      y: 0,
      scale: active ? 1 : 0.98,
      filter: "blur(0px)",
      zIndex: active ? 2 : 0,
    });
  });

  controls.forEach((control) => {
    setControlState(control, control.dataset.sceneTarget === key);
  });
}
