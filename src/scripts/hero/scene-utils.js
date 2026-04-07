/**
 * scene-utils.js
 * Reine Hilfsfunktionen für den Landing-Scene-Switcher — kein State, kein GSAP.
 * Alle Funktionen sind pure (Eingabe → Ausgabe) und testbar ohne DOM.
 */

import {
  PIECE_BURST,
  SCENE_MOTION,
  SCENE_PANEL_BASE_OFFSETS,
  SCENE_PANEL_REST_TRANSFORMS,
} from "./animation-config.js";

// ── Math-Utilities ────────────────────────────────────────────────────────────

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function wrapIndex(index, total) {
  return ((index % total) + total) % total;
}

/**
 * Gibt die Richtung (+1 oder -1) für einen Scene-Wechsel zurück,
 * unter Berücksichtigung des Wrap-Arounds.
 */
export function getDirection(currentIndex, nextIndex, total) {
  const delta = nextIndex - currentIndex;

  if (Math.abs(delta) === total - 1) {
    return delta > 0 ? -1 : 1;
  }

  return delta >= 0 ? 1 : -1;
}

// ── Scene-Motion-Lookup ───────────────────────────────────────────────────────

/** Gibt den Motion-Config-Block für einen Scene-Key zurück (Fallback: warum-wir). */
export function getSceneMotion(key) {
  return SCENE_MOTION[key] || SCENE_MOTION["warum-wir"];
}

// ── Panel-Transform-Helpers ───────────────────────────────────────────────────

/**
 * Gibt den Basis-Offset (x/y) eines Panels zurück.
 * Auf schmalen Viewports (≤ 980 px) wird kein Offset angewendet.
 */
export function getPanelBaseOffset(panelOrKey) {
  const key = typeof panelOrKey === "string" ? panelOrKey : panelOrKey?.dataset.scenePanel;
  const baseOffset = SCENE_PANEL_BASE_OFFSETS[key] || { x: 0, y: 0 };

  if (typeof window !== "undefined" && window.matchMedia("(max-width: 980px)").matches) {
    return { x: 0, y: 0 };
  }

  return baseOffset;
}

/** Gibt das CSS-Perspektive-Transform-Objekt eines Panels zurück. */
export function getPanelRestTransform(panelOrKey) {
  const key = typeof panelOrKey === "string" ? panelOrKey : panelOrKey?.dataset.scenePanel;

  return SCENE_PANEL_REST_TRANSFORMS[key] || {
    transformPerspective: 0,
    transformOrigin: "50% 50%",
  };
}

/**
 * Baut ein GSAP-kompatibles State-Objekt für ein Panel.
 * Merged Ruhezustand (Perspektive, Origin) mit den übergebenen Overrides.
 */
export function buildPanelState(panelOrKey, state) {
  const restTransform = getPanelRestTransform(panelOrKey);

  return {
    z: 0,
    scale: 1,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    skewY: 0,
    transformPerspective: restTransform.transformPerspective,
    transformOrigin: restTransform.transformOrigin,
    ...state,
  };
}

// ── DOM-Layer-Queries ─────────────────────────────────────────────────────────

/** Gibt den Burst-Config-Block für ein Assembly-Piece zurück. */
export function getBurstConfig(piece) {
  return PIECE_BURST[piece.dataset.piece] || {
    x: 0,
    y: 0,
    z: -180,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    scale: 0.84,
  };
}

/** Selektiert die Sub-Layer eines Background-Elements. */
export function getBackgroundLayers(background) {
  return {
    wash: background.querySelector(".scene-background__wash"),
    shapeA: background.querySelector(".scene-background__shape--a"),
    shapeB: background.querySelector(".scene-background__shape--b"),
    grid: background.querySelector(".scene-background__grid"),
  };
}

/** Selektiert die Sub-Layer eines Progress-Scene-Elements. */
export function getProgressLayers(progressScene) {
  return {
    halo: progressScene?.querySelector(".scene-progress__halo") ?? null,
    beam: progressScene?.querySelector(".scene-progress__beam") ?? null,
    portal: progressScene?.querySelector(".scene-progress__portal") ?? null,
    lead: progressScene?.querySelector(".scene-progress__frame--lead") ?? null,
    mid: progressScene?.querySelector(".scene-progress__frame--mid") ?? null,
    tail: progressScene?.querySelector(".scene-progress__frame--tail") ?? null,
    caption: progressScene?.querySelector(".scene-progress__caption") ?? null,
  };
}
