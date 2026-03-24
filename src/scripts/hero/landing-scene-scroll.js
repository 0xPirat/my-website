import { gsap } from "../../../public/vendor/gsap/index.js";
import {
  SCENE_TRANSITION_STORAGE_KEY,
  getScenePageRoute,
} from "../config/scene-pages.js";

const SCENE_PROGRESS_MOTION = Object.freeze({
  "warum-wir": {
    halo: { x: -18, y: -26, scale: 1.44 },
    beam: { x: 44, y: -20, rotate: -18, scaleX: 1.54, scaleY: 1.08 },
    portal: { x: 0, y: -42, rotate: -5, scale: 1.82 },
    lead: { x: -224, y: -126, rotate: -18, scale: 1.2 },
    mid: { x: 0, y: -34, rotate: 0, scale: 1.44 },
    tail: { x: 214, y: 92, rotate: 16, scale: 1.12 },
  },
  schablonen: {
    halo: { x: 18, y: -22, scale: 1.38 },
    beam: { x: -36, y: -28, rotate: 12, scaleX: 1.4, scaleY: 1.04 },
    portal: { x: 10, y: -52, rotate: 4, scale: 1.76 },
    lead: { x: -208, y: 108, rotate: -10, scale: 1.14 },
    mid: { x: 0, y: -30, rotate: -2, scale: 1.36 },
    tail: { x: 234, y: -96, rotate: 14, scale: 1.1 },
  },
  arbeit: {
    halo: { x: 12, y: -18, scale: 1.48 },
    beam: { x: 58, y: -16, rotate: -14, scaleX: 1.62, scaleY: 1.1 },
    portal: { x: 18, y: -56, rotate: 8, scale: 1.88 },
    lead: { x: -246, y: -86, rotate: -20, scale: 1.24 },
    mid: { x: 0, y: -36, rotate: 3, scale: 1.48 },
    tail: { x: 228, y: 118, rotate: 20, scale: 1.18 },
  },
  "unser-team": {
    halo: { x: -8, y: -14, scale: 1.34 },
    beam: { x: -28, y: -10, rotate: 8, scaleX: 1.36, scaleY: 1.02 },
    portal: { x: -10, y: -44, rotate: -4, scale: 1.7 },
    lead: { x: -188, y: 96, rotate: -14, scale: 1.1 },
    mid: { x: 0, y: -26, rotate: 0, scale: 1.32 },
    tail: { x: 190, y: -104, rotate: 12, scale: 1.08 },
  },
});

const SCENE_PANEL_BASE_OFFSETS = Object.freeze({
  "warum-wir": { x: 0, y: -200 },
  schablonen: { x: 0, y: -200 },
  arbeit: { x: 0, y: -200 },
  "unser-team": { x: 0, y: -200 },
});

const SCENE_PANEL_SCROLL_MOTION = Object.freeze({
  "warum-wir": {
    focusX: -118,
    focusY: -10,
    collapseX: -188,
    collapseY: -18,
    z: 156,
    collapseZ: 118,
    rotationX: 2,
    rotationY: 18,
    collapseRotationY: 10,
    rotationZ: -2.2,
    collapseRotationZ: -1.2,
    skewY: -1.4,
    collapseSkewY: -0.6,
    focusScale: 1.06,
    collapseScale: 1.16,
    perspective: 1760,
    transformOrigin: "0% 52%",
  },
  schablonen: {
    focusX: -126,
    focusY: -12,
    collapseX: -194,
    collapseY: -18,
    z: 162,
    collapseZ: 122,
    rotationX: 2.2,
    rotationY: 19,
    collapseRotationY: 11,
    rotationZ: -2.3,
    collapseRotationZ: -1.3,
    skewY: -1.6,
    collapseSkewY: -0.7,
    focusScale: 1.07,
    collapseScale: 1.17,
    perspective: 1780,
    transformOrigin: "0% 52%",
  },
  arbeit: {
    focusX: -122,
    focusY: -11,
    collapseX: -192,
    collapseY: -19,
    z: 160,
    collapseZ: 120,
    rotationX: 2,
    rotationY: 18.5,
    collapseRotationY: 10.5,
    rotationZ: -2.2,
    collapseRotationZ: -1.2,
    skewY: -1.5,
    collapseSkewY: -0.7,
    focusScale: 1.07,
    collapseScale: 1.17,
    perspective: 1770,
    transformOrigin: "0% 52%",
  },
  "unser-team": {
    focusX: -132,
    focusY: -12,
    collapseX: -196,
    collapseY: -22,
    z: 168,
    collapseZ: 124,
    rotationX: 2,
    rotationY: 20,
    collapseRotationY: 12,
    rotationZ: -2.4,
    collapseRotationZ: -1.4,
    skewY: -1.8,
    collapseSkewY: -0.8,
    focusScale: 1.08,
    collapseScale: 1.18,
    perspective: 1800,
    transformOrigin: "0% 52%",
  },
});

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function easeInOutCubic(value) {
  if (value < 0.5) {
    return 4 * value * value * value;
  }

  return 1 - ((-2 * value + 2) ** 3) / 2;
}

function getProgressLayers(progressScene) {
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

function resetProgressLayers(layers) {
  const items = [
    layers.halo,
    layers.beam,
    layers.portal,
    layers.lead,
    layers.mid,
    layers.tail,
    layers.caption,
  ].filter(Boolean);

  if (!items.length) {
    return;
  }

  gsap.set(items, {
    clearProps: "transform,opacity,filter",
  });
}

function getBackgroundLayers(background) {
  return {
    wash: background?.querySelector(".scene-background__wash") ?? null,
    shapeA: background?.querySelector(".scene-background__shape--a") ?? null,
    shapeB: background?.querySelector(".scene-background__shape--b") ?? null,
    grid: background?.querySelector(".scene-background__grid") ?? null,
  };
}

function getPanelBaseOffset(panelOrKey) {
  const key = typeof panelOrKey === "string" ? panelOrKey : panelOrKey?.dataset.scenePanel;
  const baseOffset = SCENE_PANEL_BASE_OFFSETS[key] || { x: 0, y: 0 };

  if (typeof window !== "undefined" && window.matchMedia("(max-width: 980px)").matches) {
    return { x: 0, y: 0 };
  }

  return baseOffset;
}

function getPanelScrollMotion(panelOrKey, direction) {
  const key = typeof panelOrKey === "string" ? panelOrKey : panelOrKey?.dataset.scenePanel;
  const sceneMotion = SCENE_PANEL_SCROLL_MOTION[key];

  if (sceneMotion) {
    return sceneMotion;
  }

  return {
    focusX: direction * 168,
    focusY: -24,
    collapseX: 0,
    collapseY: 0,
    z: 0,
    collapseZ: 0,
    rotationX: 0,
    rotationY: 0,
    collapseRotationY: 0,
    rotationZ: 0,
    collapseRotationZ: 0,
    skewY: 0,
    collapseSkewY: 0,
    focusScale: 1,
    collapseScale: 1,
    perspective: 0,
    transformOrigin: direction === 1 ? "100% 50%" : "0% 50%",
  };
}

export function initLandingSceneScroll({ reduceMotion = false } = {}) {
  if (!document.body.classList.contains("is-landing-reference")) {
    return;
  }

  const root = document.querySelector("[data-scene-root]");
  const shell = root?.querySelector("[data-scene-shell]");
  const backgroundStage = root?.querySelector(".landing-backgrounds");
  const stage = root?.querySelector("[data-scene-stage]");
  const copyTrack = root?.querySelector(".landing-copy-track");
  const switcher = root?.querySelector(".landing-switcher");
  const header = document.querySelector(".site-header--landing");
  const panels = Array.from(root?.querySelectorAll("[data-scene-panel]") ?? []);
  const backgrounds = Array.from(root?.querySelectorAll("[data-scene-bg]") ?? []);
  const progressScenes = Array.from(root?.querySelectorAll("[data-scene-progress]") ?? []);

  if (
    !root ||
    !shell ||
    !backgroundStage ||
    !stage ||
    !copyTrack ||
    !switcher ||
    !header ||
    !panels.length ||
    !backgrounds.length ||
    !progressScenes.length
  ) {
    return;
  }

  let wash = root.querySelector("[data-scene-scroll-wash]");

  if (!wash) {
    wash = document.createElement("div");
    wash.className = "scene-scroll-wash";
    wash.dataset.sceneScrollWash = "true";
    wash.setAttribute("aria-hidden", "true");
    shell.appendChild(wash);
  }

  const panelMap = new Map(
    panels.map((panel) => [panel.dataset.scenePanel, panel]),
  );
  const backgroundMap = new Map(
    backgrounds.map((background) => [background.dataset.sceneBg, background]),
  );
  const progressMap = new Map(
    progressScenes.map((progressScene) => [
      progressScene.dataset.sceneProgress,
      progressScene,
    ]),
  );
  const backgroundLayerMap = new Map(
    backgrounds.map((background) => [
      background.dataset.sceneBg,
      getBackgroundLayers(background),
    ]),
  );
  const progressLayerMap = new Map(
    progressScenes.map((progressScene) => [
      progressScene.dataset.sceneProgress,
      getProgressLayers(progressScene),
    ]),
  );

  let rootHeight = root.offsetHeight;
  let hasNavigated = false;

  root.dataset.sceneScroll = "active";

  const setStaticScene = () => {
    gsap.set(backgroundStage, { clearProps: "transform,filter,opacity" });
    gsap.set(stage, { clearProps: "transform,filter,opacity" });
    gsap.set(copyTrack, { clearProps: "transform,filter,opacity" });
    gsap.set(shell, { clearProps: "transform,filter,opacity" });
    gsap.set(switcher, {
      xPercent: -50,
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
    });
    gsap.set(header, { clearProps: "transform,opacity,filter" });
    gsap.set(wash, { opacity: 0 });

    panels.forEach((panel) => {
      const active = panel.classList.contains("is-active");
      const baseOffset = getPanelBaseOffset(panel);
      const direction = panel.classList.contains("scene-copy--right") ? 1 : -1;
      const panelMotion = getPanelScrollMotion(panel, direction);

      gsap.set(panel, {
        x: baseOffset.x,
        y: baseOffset.y,
        z: 0,
        scale: 1,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        skewY: 0,
        transformPerspective: panelMotion.perspective,
        transformOrigin: panelMotion.transformOrigin,
        force3D: !reduceMotion,
        opacity: active ? 1 : 0,
        filter: "blur(0px)",
      });
    });

    backgrounds.forEach((background) => {
      const active = background.classList.contains("is-active");
      const layers = backgroundLayerMap.get(background.dataset.sceneBg);

      gsap.set(background, {
        scale: active ? 1 : 1.04,
        filter: "blur(0px) brightness(1) saturate(1)",
        opacity: active ? 1 : 0,
      });

      if (layers) {
        gsap.set(
          [layers.wash, layers.shapeA, layers.shapeB, layers.grid].filter(Boolean),
          {
            clearProps: "transform,opacity,filter",
          },
        );
      }
    });

    progressScenes.forEach((progressScene) => {
      const active = progressScene.classList.contains("is-active");

      gsap.set(progressScene, {
        x: 0,
        y: 0,
        scale: 1,
        opacity: active ? 1 : 0,
        filter: "blur(0px)",
      });

      resetProgressLayers(
        progressLayerMap.get(progressScene.dataset.sceneProgress) || {},
      );
    });
  };

  const applyProgress = (progress) => {
    const sceneKey = root.dataset.scene || "warum-wir";
    const panel = panelMap.get(sceneKey);
    const background = backgroundMap.get(sceneKey);
    const progressScene = progressMap.get(sceneKey);
    const backgroundLayers = backgroundLayerMap.get(sceneKey);
    const progressLayers = progressLayerMap.get(sceneKey);
    const motion = SCENE_PROGRESS_MOTION[sceneKey] || SCENE_PROGRESS_MOTION["warum-wir"];
    const direction = panel?.classList.contains("scene-copy--right") ? 1 : -1;
    const motionFactor = reduceMotion ? 0.42 : 1;
    const blurFactor = reduceMotion ? 0.28 : 1;
    const depthFactor = reduceMotion ? 0 : 1;

    if (!panel || !background || !progressScene || !backgroundLayers || !progressLayers) {
      return;
    }

    const reveal = easeOutCubic(clamp(progress / 0.34));
    const drift = easeInOutCubic(clamp((progress - 0.08) / 0.36));
    const focus = easeInOutCubic(clamp((progress - 0.22) / 0.34));
    const burn = easeInOutCubic(clamp((progress - 0.44) / 0.26));
    const collapse = easeInOutCubic(clamp((progress - 0.62) / 0.24));
    const panelBaseOffset = getPanelBaseOffset(panel);
    const panelMotion = getPanelScrollMotion(panel, direction);
    const panelScale = lerp(
      lerp(1, panelMotion.focusScale, focus),
      panelMotion.collapseScale,
      collapse,
    );

    gsap.set(backgroundStage, {
      scale: lerp(1, 1.14, reveal),
      yPercent: lerp(0, -4 * motionFactor, drift),
      filter:
        `blur(${lerp(0, 18 * blurFactor, burn)}px) ` +
        `brightness(${lerp(1, 0.78, burn)}) saturate(${lerp(1, 0.78, burn)})`,
    });

    gsap.set(background, {
      scale: lerp(1, 1.22, reveal),
      filter:
        `blur(${lerp(0, 16 * blurFactor, burn)}px) ` +
        `brightness(${lerp(1, 0.72, burn)}) saturate(${lerp(1, 0.72, burn)})`,
    });

    gsap.set(stage, {
      scale: lerp(1, 1.18, reveal),
      y: lerp(0, -28 * motionFactor, collapse),
      filter: `blur(${lerp(0, 10 * blurFactor, burn)}px)`,
      opacity: lerp(1, 0.92, collapse),
    });

    gsap.set(copyTrack, {
      y: lerp(0, -22 * motionFactor, focus),
      filter: `blur(${lerp(0, 10 * blurFactor, burn)}px)`,
    });

    gsap.set(panel, {
      x:
        panelBaseOffset.x +
        lerp(0, panelMotion.focusX * motionFactor, focus) +
        lerp(0, panelMotion.collapseX * motionFactor, collapse),
      y:
        panelBaseOffset.y +
        lerp(0, panelMotion.focusY * motionFactor, focus) +
        lerp(0, panelMotion.collapseY * motionFactor, collapse),
      z:
        (lerp(0, panelMotion.z * motionFactor, focus) +
          lerp(0, panelMotion.collapseZ * motionFactor, collapse)) *
        depthFactor,
      scale: panelScale,
      rotationX: lerp(0, panelMotion.rotationX, focus) * depthFactor,
      rotationY:
        (lerp(0, panelMotion.rotationY, focus) +
          lerp(0, panelMotion.collapseRotationY, collapse)) *
        depthFactor,
      rotationZ:
        (lerp(0, panelMotion.rotationZ, focus) +
          lerp(0, panelMotion.collapseRotationZ, collapse)) *
        depthFactor,
      skewY:
        (lerp(0, panelMotion.skewY, focus) +
          lerp(0, panelMotion.collapseSkewY, collapse)) *
        depthFactor,
      transformPerspective: panelMotion.perspective,
      transformOrigin: panelMotion.transformOrigin,
      force3D: !reduceMotion,
      opacity: lerp(1, 0, collapse),
      filter: `blur(${lerp(0, 18 * blurFactor, burn)}px)`,
    });

    gsap.set(switcher, {
      xPercent: -50,
      y: lerp(0, 46 * motionFactor, focus),
      opacity: lerp(1, 0.06, collapse),
      filter: `blur(${lerp(0, 12 * blurFactor, burn)}px)`,
    });

    gsap.set(header, {
      y: lerp(0, -20 * motionFactor, focus),
      opacity: lerp(1, 0.2, collapse),
      filter: `blur(${lerp(0, 8 * blurFactor, burn)}px)`,
    });

    gsap.set(backgroundLayers.shapeA, {
      xPercent: -lerp(0, 32 * motionFactor, focus),
      yPercent: -lerp(0, 12 * motionFactor, focus),
      rotate: -lerp(0, 8 * motionFactor, focus),
      scale: lerp(1, 1.08, reveal),
      opacity: lerp(1, 0.52, collapse),
      filter: `blur(${lerp(0, 10 * blurFactor, burn)}px)`,
    });

    gsap.set(backgroundLayers.shapeB, {
      xPercent: lerp(0, 34 * motionFactor, focus),
      yPercent: -lerp(0, 10 * motionFactor, focus),
      rotate: lerp(0, 8 * motionFactor, focus),
      scale: lerp(1, 1.1, reveal),
      opacity: lerp(1, 0.44, collapse),
      filter: `blur(${lerp(0, 12 * blurFactor, burn)}px)`,
    });

    gsap.set(backgroundLayers.wash, {
      scale: lerp(1, 1.24, reveal),
      xPercent: direction * lerp(0, 8 * motionFactor, focus),
      yPercent: -lerp(0, 14 * motionFactor, focus),
      opacity: lerp(1, 0.44, collapse),
      filter: `blur(${lerp(0, 24 * blurFactor, burn)}px)`,
    });

    gsap.set(backgroundLayers.grid, {
      yPercent: lerp(0, 18 * motionFactor, focus),
      scale: lerp(1, 1.1, reveal),
      opacity: lerp(0.24, 0.03, collapse),
      filter: `blur(${lerp(0, 8 * blurFactor, burn)}px)`,
    });

    gsap.set(progressScene, {
      y: lerp(0, -14 * motionFactor, drift),
      scale: lerp(1, 1.06, reveal),
      opacity: lerp(1, 0.16, collapse),
      filter: `blur(${lerp(0, 8 * blurFactor, burn)}px)`,
    });

    gsap.set(progressLayers.halo, {
      x: lerp(0, motion.halo.x * motionFactor, focus),
      y: lerp(0, motion.halo.y * motionFactor, focus),
      scale: lerp(1, motion.halo.scale, reveal),
      opacity: lerp(0.76, 1, drift) * lerp(1, 0.24, collapse),
      filter: `blur(${lerp(16, 36 * blurFactor, burn)}px)`,
    });

    gsap.set(progressLayers.beam, {
      x: lerp(0, motion.beam.x * motionFactor, focus),
      y: lerp(0, motion.beam.y * motionFactor, focus),
      rotate: lerp(0, motion.beam.rotate, focus),
      scaleX: lerp(1, motion.beam.scaleX, drift),
      scaleY: lerp(1, motion.beam.scaleY, drift),
      opacity: lerp(0.44, 1, reveal) * lerp(1, 0.18, collapse),
      filter: `blur(${lerp(0, 8 * blurFactor, burn)}px)`,
    });

    gsap.set(progressLayers.portal, {
      x: lerp(0, motion.portal.x * motionFactor, focus),
      y: lerp(0, motion.portal.y * motionFactor, focus),
      rotate: lerp(0, motion.portal.rotate, focus),
      scale: lerp(1, motion.portal.scale, reveal),
      opacity: lerp(1, 0.14, collapse),
      filter:
        `blur(${lerp(0, 18 * blurFactor, burn)}px) ` +
        `saturate(${lerp(1, 0.82, collapse)}) brightness(${lerp(1, 0.82, burn)})`,
    });

    gsap.set(progressLayers.lead, {
      x: lerp(0, motion.lead.x * motionFactor, focus),
      y: lerp(0, motion.lead.y * motionFactor, focus),
      rotate: lerp(0, motion.lead.rotate, focus),
      scale: lerp(1, motion.lead.scale, reveal),
      opacity: lerp(0.92, 0.1, collapse),
      filter: `blur(${lerp(0, 12 * blurFactor, burn)}px)`,
    });

    gsap.set(progressLayers.mid, {
      x: lerp(0, motion.mid.x * motionFactor, focus),
      y: lerp(0, motion.mid.y * motionFactor, focus),
      rotate: lerp(0, motion.mid.rotate, focus),
      scale: lerp(1, motion.mid.scale, reveal),
      opacity: lerp(0.92, 0.08, collapse),
      filter: `blur(${lerp(0, 12 * blurFactor, burn)}px)`,
    });

    gsap.set(progressLayers.tail, {
      x: lerp(0, motion.tail.x * motionFactor, focus),
      y: lerp(0, motion.tail.y * motionFactor, focus),
      rotate: lerp(0, motion.tail.rotate, focus),
      scale: lerp(1, motion.tail.scale, reveal),
      opacity: lerp(0.92, 0.1, collapse),
      filter: `blur(${lerp(0, 12 * blurFactor, burn)}px)`,
    });

    gsap.set(progressLayers.caption, {
      y: lerp(0, -28 * motionFactor, burn),
      opacity: lerp(0.92, 0, collapse),
      filter: `blur(${lerp(0, 10 * blurFactor, burn)}px)`,
    });

    gsap.set(wash, {
      opacity: lerp(0, 1, burn),
    });
  };

  const measure = () => {
    rootHeight = root.offsetHeight;
  };

  const navigateToScene = (sceneKey) => {
    if (hasNavigated) {
      return;
    }

    hasNavigated = true;

    try {
      window.sessionStorage.setItem(SCENE_TRANSITION_STORAGE_KEY, sceneKey);
    } catch (error) {
      // Continue without transition memory if storage is unavailable.
    }

    window.location.href = getScenePageRoute(sceneKey);
  };

  const tick = () => {
    const travel = Math.max(rootHeight - window.innerHeight, 1);
    const rect = root.getBoundingClientRect();
    const progress = clamp(-rect.top / travel, 0, 1);
    applyProgress(progress);

    if (progress >= 0.999) {
      navigateToScene(root.dataset.scene || "warum-wir");
    }
  };

  setStaticScene();
  measure();
  applyProgress(0);
  gsap.ticker.add(tick);
  window.addEventListener("resize", measure);

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => {
      measure();
    });

    resizeObserver.observe(root);
    resizeObserver.observe(shell);
  }
}
