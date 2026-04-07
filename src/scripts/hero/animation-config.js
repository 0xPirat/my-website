/**
 * animation-config.js
 * Zentrale Konfiguration für die Landing-Scene-Switcher-Animation.
 * Enthält alle Motion-Mappings, Burst-Offsets, Panel-Transforms und Feature-Flags.
 * Keine Logik, keine Imports — reine Datenkonstanten.
 */

// Burst-Positionen der Assembly-Pieces beim Scene-Wechsel (Exit-Explosion).
export const PIECE_BURST = Object.freeze({
  "prism-left": { x: -250, y: -150, z: -260, rotationX: -20, rotationY: 28, rotationZ: -18, scale: 0.76 },
  "prism-right": { x: 240, y: -130, z: -240, rotationX: 16, rotationY: -30, rotationZ: 16, scale: 0.78 },
  beam: { x: -140, y: 80, z: -220, rotationX: 8, rotationY: 14, rotationZ: -10, scale: 0.8 },
  node: { x: 170, y: 126, z: -190, rotationX: 22, rotationY: -18, rotationZ: 18, scale: 0.76 },
});

// Pro-Scene Motion-Werte: Enter/Exit-Offsets, Shell/Stage-Shifts, Parallax- und Float-Intensitäten.
export const SCENE_MOTION = Object.freeze({
  "warum-wir": {
    enterX: 12,
    enterY: -4,
    enterRotate: 1.8,
    exitX: -9,
    exitY: 3,
    exitRotate: -1.6,
    shellX: -28,
    shellY: 12,
    shellRotateX: 1.6,
    shellRotateY: -4.4,
    stageX: -20,
    stageY: 12,
    stageRotateY: -7,
    parallaxX: 18,
    parallaxY: 10,
    floatX: 10,
    floatY: 8,
    washX: -20,
    washY: -14,
    shapeAX: -12,
    shapeAY: 10,
    shapeARotate: -5,
    shapeBX: 18,
    shapeBY: -8,
    shapeBRotate: 4,
    gridX: -10,
    gridY: 8,
  },
  schablonen: {
    enterX: 15,
    enterY: -2,
    enterRotate: 2.2,
    exitX: -12,
    exitY: 2,
    exitRotate: -1.8,
    shellX: -18,
    shellY: 8,
    shellRotateX: 1.4,
    shellRotateY: -3.6,
    stageX: -14,
    stageY: 8,
    stageRotateY: -5,
    parallaxX: 5,
    parallaxY: 3,
    floatX: 2,
    floatY: 1.5,
    washX: 22,
    washY: -12,
    shapeAX: -18,
    shapeAY: 12,
    shapeARotate: -6,
    shapeBX: 16,
    shapeBY: -10,
    shapeBRotate: 3,
    gridX: 10,
    gridY: -6,
  },
  arbeit: {
    enterX: 10,
    enterY: 3,
    enterRotate: 1.6,
    exitX: -14,
    exitY: -2,
    exitRotate: -2.1,
    shellX: -32,
    shellY: 14,
    shellRotateX: 1.8,
    shellRotateY: -4.8,
    stageX: -24,
    stageY: 10,
    stageRotateY: -7.4,
    parallaxX: 20,
    parallaxY: 12,
    floatX: 10,
    floatY: 8,
    washX: 18,
    washY: -18,
    shapeAX: -22,
    shapeAY: 10,
    shapeARotate: -7,
    shapeBX: 22,
    shapeBY: -12,
    shapeBRotate: 5,
    gridX: 14,
    gridY: 10,
  },
  "unser-team": {
    enterX: 13,
    enterY: -3,
    enterRotate: 1.7,
    exitX: -10,
    exitY: 2,
    exitRotate: -1.5,
    shellX: -20,
    shellY: 8,
    shellRotateX: 1.3,
    shellRotateY: -3.2,
    stageX: -14,
    stageY: 8,
    stageRotateY: -4.6,
    parallaxX: 12,
    parallaxY: 7,
    floatX: 7,
    floatY: 5,
    washX: -12,
    washY: -10,
    shapeAX: -10,
    shapeAY: 6,
    shapeARotate: -2,
    shapeBX: 12,
    shapeBY: -6,
    shapeBRotate: 2,
    gridX: 8,
    gridY: -6,
  },
});

// Basis-Offset jedes Panels im Ruhezustand (vor GSAP-Transforms).
export const SCENE_PANEL_BASE_OFFSETS = Object.freeze({
  "warum-wir": { x: 0, y: -200 },
  schablonen: { x: 0, y: -200 },
  arbeit: { x: 0, y: -200 },
  "unser-team": { x: 0, y: -200 },
});

// CSS-Perspektive und transformOrigin pro Scene-Panel im Ruhezustand.
export const SCENE_PANEL_REST_TRANSFORMS = Object.freeze({
  "warum-wir": { transformPerspective: 1760, transformOrigin: "0% 52%" },
  schablonen: { transformPerspective: 1780, transformOrigin: "0% 52%" },
  arbeit: { transformPerspective: 1770, transformOrigin: "0% 52%" },
  "unser-team": { transformPerspective: 1800, transformOrigin: "0% 52%" },
});

/**
 * Feature-Flags für die Landing-Scene.
 * Hier zentral umschalten statt tief im Code suchen.
 *
 *  disableInteractiveDrift – schaltet den Pointer-Parallax-Loop ab.
 *  skipInitialSceneIntro   – zeigt die erste Scene sofort (kein Intro-Tween).
 */
export const FEATURE_FLAGS = Object.freeze({
  disableInteractiveDrift: true,
  skipInitialSceneIntro: true,
});
