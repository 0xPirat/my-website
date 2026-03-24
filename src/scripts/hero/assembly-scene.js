import { gsap } from "../../../public/vendor/gsap/index.js";
import { ScrollTrigger } from "../../../public/vendor/gsap/ScrollTrigger.js";

gsap.registerPlugin(ScrollTrigger);

const PIECE_CONFIG = {
  "prism-left": {
    start: 0,
    end: 0.46,
    fromX: -0.82,
    fromY: -0.16,
    fromZ: -620,
    fromRX: -22,
    fromRY: 36,
    fromRZ: -24,
    fromScale: 0.56,
    fromOpacity: 0.01,
    fromBlur: 32,
    driftX: 14,
    driftY: 7,
    driftZ: 22,
    phase: 0.15,
  },
  "prism-right": {
    start: 0.06,
    end: 0.5,
    fromX: 0.86,
    fromY: -0.08,
    fromZ: -600,
    fromRX: 18,
    fromRY: -38,
    fromRZ: 22,
    fromScale: 0.58,
    fromOpacity: 0.01,
    fromBlur: 30,
    driftX: 13,
    driftY: 8,
    driftZ: 20,
    phase: 0.7,
  },
  beam: {
    start: 0.12,
    end: 0.7,
    fromX: -0.18,
    fromY: 0.2,
    fromZ: -420,
    fromRX: 12,
    fromRY: 18,
    fromRZ: -10,
    fromScale: 0.62,
    fromOpacity: 0,
    fromBlur: 28,
    driftX: 8,
    driftY: 4,
    driftZ: 12,
    phase: 1.5,
  },
  node: {
    start: 0.18,
    end: 0.74,
    fromX: 0.46,
    fromY: 0.42,
    fromZ: -260,
    fromRX: 20,
    fromRY: -18,
    fromRZ: 14,
    fromScale: 0.48,
    fromOpacity: 0,
    fromBlur: 20,
    driftX: 6,
    driftY: 5,
    driftZ: 8,
    phase: 2.45,
  },
  "hash-card": {
    start: 0.04,
    end: 0.44,
    fromX: 0.16,
    fromY: -0.8,
    fromZ: -760,
    fromRX: -28,
    fromRY: 32,
    fromRZ: -18,
    fromScale: 0.56,
    fromOpacity: 0.02,
    fromBlur: 28,
    driftX: 6,
    driftY: 4,
    driftZ: 9,
    phase: 0.6,
  },
  backplane: {
    start: 0.1,
    end: 0.58,
    fromX: 0.92,
    fromY: -0.2,
    fromZ: -980,
    fromRX: -18,
    fromRY: 34,
    fromRZ: 14,
    fromScale: 0.6,
    fromOpacity: 0.02,
    fromBlur: 32,
    driftX: 8,
    driftY: 5,
    driftZ: 12,
    phase: 1.1,
  },
  frame: {
    start: 0.12,
    end: 0.6,
    fromX: 0.76,
    fromY: 0.02,
    fromZ: -860,
    fromRX: 20,
    fromRY: -36,
    fromRZ: 20,
    fromScale: 0.58,
    fromOpacity: 0.02,
    fromBlur: 28,
    driftX: 7,
    driftY: 5,
    driftZ: 10,
    phase: 2.2,
  },
  window: {
    start: 0,
    end: 0.56,
    fromX: -0.82,
    fromY: 0.34,
    fromZ: -940,
    fromRX: 26,
    fromRY: -34,
    fromRZ: -20,
    fromScale: 0.52,
    fromOpacity: 0.01,
    fromBlur: 30,
    driftX: 8,
    driftY: 6,
    driftZ: 12,
    phase: 0.2,
  },
  "brace-chip": {
    start: 0.18,
    end: 0.54,
    fromX: -0.92,
    fromY: 0.36,
    fromZ: -700,
    fromRX: -14,
    fromRY: -18,
    fromRZ: -22,
    fromScale: 0.56,
    fromOpacity: 0.04,
    fromBlur: 22,
    driftX: 6,
    driftY: 4,
    driftZ: 7,
    phase: 1.7,
  },
  brace: {
    start: 0.2,
    end: 0.62,
    fromX: 0.88,
    fromY: -0.12,
    fromZ: -760,
    fromRX: -22,
    fromRY: 28,
    fromRZ: 20,
    fromScale: 0.5,
    fromOpacity: 0.02,
    fromBlur: 20,
    driftX: 6,
    driftY: 4,
    driftZ: 7,
    phase: 2.8,
  },
  stand: {
    start: 0.34,
    end: 0.72,
    fromX: -0.08,
    fromY: 0.8,
    fromZ: -420,
    fromRX: 24,
    fromRY: 0,
    fromRZ: -10,
    fromScale: 0.62,
    fromOpacity: 0.08,
    fromBlur: 18,
    driftX: 4,
    driftY: 3,
    driftZ: 5,
    phase: 0.95,
  },
  cup: {
    start: 0.4,
    end: 0.78,
    fromX: 0.34,
    fromY: 0.86,
    fromZ: -260,
    fromRX: 22,
    fromRY: -18,
    fromRZ: 16,
    fromScale: 0.58,
    fromOpacity: 0.06,
    fromBlur: 16,
    driftX: 3,
    driftY: 2,
    driftZ: 4,
    phase: 1.34,
  },
};

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

function buildPieceState(element) {
  const key = element.dataset.piece;
  const config = PIECE_CONFIG[key];

  if (!config) {
    return null;
  }

  return { element, config };
}

function setPieceTransform(piece, progress, time, bounds, pointer, staticMode = false) {
  const { element, config } = piece;
  const localProgress = clamp((progress - config.start) / (config.end - config.start || 1));
  const eased = easeOutCubic(localProgress);
  const settle = staticMode ? 0 : easeInOutCubic(clamp((progress - config.end + 0.1) / 0.26));
  const finalLock = staticMode ? 1 : easeInOutCubic(clamp((progress - 0.78) / 0.18));
  const floatStrength = staticMode ? 0 : settle * (1 - finalLock);
  const pointerStrength = staticMode
    ? 0
    : settle * (1 - finalLock * 0.88) * lerp(0.38, 1, clamp(Math.abs(config.fromZ) / 620, 0, 1));
  const translateX =
    bounds.width * config.fromX * (1 - eased) +
    Math.sin(time * 0.001 + config.phase) * config.driftX * floatStrength +
    pointer.x * bounds.width * 0.02 * pointerStrength;
  const translateY =
    bounds.height * config.fromY * (1 - eased) +
    Math.cos(time * 0.0012 + config.phase) * config.driftY * floatStrength +
    pointer.y * bounds.height * 0.016 * pointerStrength;
  const translateZ =
    config.fromZ * (1 - eased) +
    Math.sin(time * 0.0011 + config.phase) * config.driftZ * floatStrength;
  const rotateX = config.fromRX * (1 - eased) - pointer.y * 7.5 * pointerStrength;
  const rotateY = config.fromRY * (1 - eased) + pointer.x * 10 * pointerStrength;
  const rotateZ =
    config.fromRZ * (1 - eased) +
    Math.sin(time * 0.0008 + config.phase) * 0.8 * floatStrength +
    pointer.x * 1.4 * pointerStrength;
  const scale = lerp(config.fromScale, 1, eased);
  const opacity = lerp(config.fromOpacity, 1, eased);
  const blur = lerp(config.fromBlur, 0, eased);
  const saturation = lerp(0.72, 1.03, eased);
  const brightness = lerp(0.8, 1, eased) + Math.sin(time * 0.001 + config.phase) * 0.02 * floatStrength;

  element.style.transform =
    `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) ` +
    `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`;
  element.style.opacity = opacity.toFixed(3);
  element.style.filter = `blur(${blur}px) saturate(${saturation}) brightness(${brightness})`;
}

function renderStage({ assembly, stage, pieces, progress, bounds, time, pointer, staticMode = false }) {
  const introProgress = staticMode ? 1 : easeOutCubic(clamp(progress / 0.3));
  const settleProgress = easeOutCubic(progress);
  const roomProgress = staticMode ? 1 : easeInOutCubic(clamp((progress - 0.18) / 0.64));
  const lift = staticMode ? 0 : lerp(96, 0, settleProgress);
  const tilt = staticMode ? 0 : lerp(10, 0, settleProgress);
  const scale = staticMode ? 1 : lerp(1.28, 1, settleProgress);
  const introOpacity = staticMode ? 0 : 1 - introProgress;
  const introScale = staticMode ? 0.94 : lerp(1, 0.9, introProgress);
  const introShift = staticMode ? 0 : lerp(0, 22, introProgress);
  const roomVeil = staticMode ? 0.18 : lerp(1, 0.24, roomProgress);
  const roomCore = staticMode ? 0.42 : lerp(0, 0.36, roomProgress);
  const frameOpacity = staticMode ? 0.82 : lerp(0, 0.1, roomProgress);
  const outlineOpacity = staticMode ? 0.36 : lerp(0, 0.04, roomProgress);
  const pointerTiltX = staticMode ? 0 : pointer.y * -8 * roomProgress;
  const pointerTiltY = staticMode ? 0 : pointer.x * 11 * roomProgress;
  const assemblyShiftX = staticMode ? 0 : pointer.x * 34 * roomProgress;
  const assemblyShiftY = staticMode ? 0 : pointer.y * 18 * roomProgress;

  assembly.style.setProperty("--assembly-progress", progress.toFixed(3));
  stage.style.setProperty("--room-progress", roomProgress.toFixed(3));
  stage.style.setProperty("--room-veil-opacity", roomVeil.toFixed(3));
  stage.style.setProperty("--room-core-opacity", roomCore.toFixed(3));
  stage.style.setProperty("--room-frame-opacity", frameOpacity.toFixed(3));
  stage.style.setProperty("--room-outline-opacity", outlineOpacity.toFixed(3));
  stage.style.setProperty("--hero-intro-opacity", introOpacity.toFixed(3));
  stage.style.setProperty("--hero-intro-scale", introScale.toFixed(3));
  stage.style.setProperty("--hero-intro-shift", introShift.toFixed(3));
  stage.style.setProperty("--hero-tilt-x", pointerTiltX.toFixed(3));
  stage.style.setProperty("--hero-tilt-y", pointerTiltY.toFixed(3));
  stage.style.setProperty("--hero-drift-x", `${(pointer.x * 26).toFixed(2)}px`);
  stage.style.setProperty("--hero-drift-y", `${(pointer.y * 18).toFixed(2)}px`);
  stage.style.setProperty("--hero-light-x", `${(50 + pointer.x * 10).toFixed(2)}%`);
  stage.style.setProperty("--hero-light-y", `${(25 + pointer.y * 8).toFixed(2)}%`);
  assembly.style.transform =
    `translate3d(${assemblyShiftX}px, ${lift + assemblyShiftY}px, 0) ` +
    `rotateX(${tilt + pointerTiltX}deg) rotateY(${pointerTiltY}deg) ` +
    `rotateZ(${(pointerTiltY * 0.12).toFixed(3)}deg) scale(${scale})`;

  pieces.forEach((piece) => {
    setPieceTransform(piece, progress, time, bounds, pointer, staticMode);
  });
}

export function initHeroAssembly({ reduceMotion }) {
  const hero = document.querySelector(".hero");
  const assembly = document.getElementById("hero-assembly");
  const stage = hero?.querySelector(".hero-stage");

  if (!hero || !assembly || !stage) {
    return;
  }

  const pieces = Array.from(assembly.querySelectorAll("[data-piece]"))
    .map(buildPieceState)
    .filter(Boolean);

  if (!pieces.length) {
    return;
  }

  let bounds = assembly.getBoundingClientRect();
  const state = {
    progress: reduceMotion ? 1 : 0,
    pointerX: 0,
    pointerY: 0,
    targetPointerX: 0,
    targetPointerY: 0,
  };

  const measure = () => {
    bounds = assembly.getBoundingClientRect();
  };

  const render = (time = performance.now(), staticMode = reduceMotion) => {
    if (!staticMode) {
      state.pointerX = lerp(state.pointerX, state.targetPointerX, 0.085);
      state.pointerY = lerp(state.pointerY, state.targetPointerY, 0.085);
    }

    renderStage({
      assembly,
      stage,
      pieces,
      progress: state.progress,
      bounds,
      time,
      pointer: { x: state.pointerX, y: state.pointerY },
      staticMode,
    });
  };

  if (reduceMotion) {
    assembly.classList.add("is-static");
    measure();
    render(0, true);
    return;
  }

  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: () => `+=${Math.max(window.innerHeight * 3.2, hero.offsetHeight * 1.9)}`,
      scrub: 1.1,
      pin: stage,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefreshInit: measure,
      onRefresh: measure,
      onUpdate: (self) => {
        state.progress = self.progress;
      },
    },
  });

  timeline.to(state, { progress: 1 });

  const handlePointerMove = (event) => {
    const rect = stage.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;

    state.targetPointerX = clamp(x, -1, 1);
    state.targetPointerY = clamp(y, -1, 1);
  };

  const handlePointerLeave = () => {
    state.targetPointerX = 0;
    state.targetPointerY = 0;
  };

  const tick = () => {
    render(performance.now(), false);
  };

  gsap.ticker.add(tick);
  stage.addEventListener("pointermove", handlePointerMove);
  stage.addEventListener("pointerleave", handlePointerLeave);
  stage.addEventListener("pointercancel", handlePointerLeave);

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => {
      measure();
      ScrollTrigger.refresh();
    });

    resizeObserver.observe(hero);
    resizeObserver.observe(stage);
    resizeObserver.observe(assembly);
  }

  measure();
  render();
  ScrollTrigger.refresh();
}
