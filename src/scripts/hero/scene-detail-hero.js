import { gsap } from "../../../public/vendor/gsap/index.js";

const STATIC_PROGRESS = 0.38;

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

export function initSceneDetailHero({ reduceMotion = false } = {}) {
  const root = document.querySelector("[data-scene-detail-root]");

  if (!root) {
    return;
  }

  const shell = root.querySelector("[data-scene-detail-shell]");
  const stage = root.querySelector("[data-scene-detail-stage]");
  const viewport = root.querySelector("[data-scene-detail-viewport]");
  const copy = root.querySelector("[data-scene-detail-copy]");
  const prompt = root.querySelector("[data-scene-detail-prompt]");
  const switcher = root.querySelector("[data-scene-detail-switcher]");
  const outro = document.querySelector("[data-scene-detail-outro]");
  const layers = {
    far: root.querySelector('[data-detail-layer="far"]'),
    mid: root.querySelector('[data-detail-layer="mid"]'),
    focus: root.querySelector('[data-detail-layer="focus"]'),
    overlay: root.querySelector('[data-detail-layer="overlay"]'),
    edgeLeft: root.querySelector('[data-detail-layer="edge-left"]'),
    edgeRight: root.querySelector('[data-detail-layer="edge-right"]'),
    glow: root.querySelector('[data-detail-layer="glow"]'),
    grid: root.querySelector('[data-detail-layer="grid"]'),
    frame: root.querySelector('[data-detail-layer="frame"]'),
    vignette: root.querySelector('[data-detail-layer="vignette"]'),
  };

  if (
    !shell ||
    !stage ||
    !viewport ||
    !copy ||
    !prompt ||
    Object.values(layers).some((layer) => !layer)
  ) {
    return;
  }

  const state = {
    progress: 0,
    pointerX: 0,
    pointerY: 0,
    targetPointerX: 0,
    targetPointerY: 0,
  };
  const motionFactor = reduceMotion ? 0.38 : 1;

  let stageBounds = stage.getBoundingClientRect();
  let rootHeight = root.offsetHeight;

  const measure = () => {
    stageBounds = stage.getBoundingClientRect();
    rootHeight = root.offsetHeight;
  };

  const updateProgress = () => {
    const travel = Math.max(rootHeight - window.innerHeight, 1);
    const rect = root.getBoundingClientRect();
    state.progress = clamp(-rect.top / travel, 0, 1);
  };

  const render = (time = performance.now(), staticMode = reduceMotion) => {
    if (!staticMode) {
      state.pointerX = lerp(state.pointerX, state.targetPointerX, 0.085);
      state.pointerY = lerp(state.pointerY, state.targetPointerY, 0.085);
    }

    const progress = staticMode ? STATIC_PROGRESS : state.progress;
    const intro = easeOutCubic(clamp(progress / 0.2));
    const focus = easeInOutCubic(clamp(progress / 0.7));
    const outroProgress = easeInOutCubic(clamp((progress - 0.76) / 0.24));
    const pointerX = state.pointerX * motionFactor;
    const pointerY = state.pointerY * motionFactor;
    const floatX = Math.sin(time * 0.00028) * lerp(3, 10, motionFactor);
    const floatY = Math.cos(time * 0.00024) * lerp(2, 8, motionFactor);
    const focusInner = lerp(20 - motionFactor * 2, 12, focus);
    const focusOuter = lerp(46 - motionFactor * 4, 26, focus);
    const sideBlur = lerp(8 + (1 - motionFactor) * 4, 54 * motionFactor, focus);
    const focusGlowOpacity = lerp(0.26, 0.72, focus) * (1 - outroProgress * 0.45);
    const vignetteOpacity = lerp(0.46, 0.86, focus);
    const copyFade = easeInOutCubic(clamp((progress - 0.42) / 0.2));
    const promptFade = easeInOutCubic(clamp((progress - 0.16) / 0.18));
    const focusZoom = lerp(1.02 + motionFactor * 0.02, 1.14 + motionFactor * 0.4, focus);
    const frameScale = lerp(1.12 + motionFactor * 0.06, 0.82, focus);
    const promptLift = lerp(0, -34, promptFade);
    const copyLift = lerp(0, -58, copyFade);
    const copyShiftX = pointerX * 16;
    const copyShiftY = pointerY * 12 + copyLift;
    const overlayScale = lerp(1.08 + motionFactor * 0.06, 1.24 + motionFactor * 0.82, focus);
    const widthFactor = clamp(stageBounds.width / 1400, 0.72, 1);

    root.style.setProperty("--detail-progress", progress.toFixed(3));
    root.style.setProperty("--detail-focus-inner", `${focusInner.toFixed(2)}%`);
    root.style.setProperty("--detail-focus-outer", `${focusOuter.toFixed(2)}%`);
    root.style.setProperty("--detail-side-blur", `${sideBlur.toFixed(2)}px`);
    root.style.setProperty("--detail-glow-opacity", focusGlowOpacity.toFixed(3));
    root.style.setProperty("--detail-vignette-opacity", vignetteOpacity.toFixed(3));
    root.style.setProperty("--hero-light-x", `${(50 + pointerX * 10).toFixed(2)}%`);
    root.style.setProperty("--hero-light-y", `${(28 + pointerY * 8).toFixed(2)}%`);

    viewport.style.transform =
      `translate3d(${(-pointerX * 22 + floatX * 0.28).toFixed(2)}px, ${(-pointerY * 16 + floatY * 0.24).toFixed(2)}px, 0) ` +
      `scale(${focusZoom.toFixed(3)})`;

    layers.far.style.transform =
      `translate3d(${(-pointerX * 38 * widthFactor + floatX).toFixed(2)}px, ${(-pointerY * 26 * widthFactor + floatY * 0.82).toFixed(2)}px, -260px) ` +
      `rotateX(${(-pointerY * 3.4).toFixed(2)}deg) rotateY(${(pointerX * 4.5).toFixed(2)}deg) ` +
      `scale(${lerp(1.12 + motionFactor * 0.04, 1.2 + motionFactor * 0.2, focus).toFixed(3)})`;

    layers.mid.style.transform =
      `translate3d(${(pointerX * 30 * widthFactor + floatX * 0.42).toFixed(2)}px, ${(pointerY * 18 * widthFactor + floatY * 0.46 - focus * 18).toFixed(2)}px, 0) ` +
      `rotateX(${(-pointerY * 5.4).toFixed(2)}deg) rotateY(${(pointerX * 7.2).toFixed(2)}deg) ` +
      `scale(${lerp(1.02 + motionFactor * 0.02, 1.1 + motionFactor * 0.28, focus).toFixed(3)})`;

    layers.focus.style.transform =
      `translate3d(${(pointerX * 54 * widthFactor + floatX * 0.55).toFixed(2)}px, ${(pointerY * 30 * widthFactor + floatY * 0.28 - focus * 28).toFixed(2)}px, 160px) ` +
      `rotateX(${(-pointerY * 7.2).toFixed(2)}deg) rotateY(${(pointerX * 10.4).toFixed(2)}deg) ` +
      `scale(${lerp(1.06 + motionFactor * 0.04, 1.18 + motionFactor * 0.68, focus).toFixed(3)})`;

    layers.overlay.style.transform =
      `translate3d(${(pointerX * 68 * widthFactor + floatX * 0.6).toFixed(2)}px, ${(pointerY * 38 * widthFactor + floatY * 0.18 - focus * 34).toFixed(2)}px, 230px) ` +
      `rotateX(${(-pointerY * 8.8).toFixed(2)}deg) rotateY(${(pointerX * 12.4).toFixed(2)}deg) ` +
      `scale(${overlayScale.toFixed(3)})`;

    layers.edgeLeft.style.transform =
      `translate3d(${(-pointerX * 70 * widthFactor - focus * 52).toFixed(2)}px, ${(pointerY * 10 + floatY * 0.12).toFixed(2)}px, -100px) ` +
      `scale(${lerp(1.08 + motionFactor * 0.1, 1.18 + motionFactor * 0.34, focus).toFixed(3)})`;

    layers.edgeRight.style.transform =
      `translate3d(${(pointerX * 70 * widthFactor + focus * 52).toFixed(2)}px, ${(-pointerY * 10 + floatY * 0.12).toFixed(2)}px, -100px) ` +
      `scale(${lerp(1.08 + motionFactor * 0.1, 1.18 + motionFactor * 0.34, focus).toFixed(3)})`;

    layers.glow.style.transform =
      `translate3d(${(pointerX * 24 + floatX * 0.18).toFixed(2)}px, ${(pointerY * 16 + floatY * 0.16 - focus * 12).toFixed(2)}px, 120px) ` +
      `scale(${lerp(1.01, 1.08 + motionFactor * 0.18, focus).toFixed(3)})`;

    layers.grid.style.transform =
      `translate3d(${(pointerX * 18).toFixed(2)}px, ${(pointerY * 12 + focus * 26).toFixed(2)}px, -140px) ` +
      `rotateX(76deg) scale(${lerp(1, 1.12, focus).toFixed(3)})`;

    layers.frame.style.transform =
      `translate3d(${(pointerX * 10).toFixed(2)}px, ${(pointerY * 8 - focus * 6).toFixed(2)}px, 260px) ` +
      `scale(${frameScale.toFixed(3)})`;

    copy.style.opacity = (1 - copyFade * 0.94).toFixed(3);
    copy.style.transform = `translate3d(${copyShiftX.toFixed(2)}px, ${copyShiftY.toFixed(2)}px, 0)`;

    prompt.style.opacity = (1 - promptFade * 0.98).toFixed(3);
    prompt.style.transform =
      `translate3d(${(-pointerX * 18).toFixed(2)}px, ${(pointerY * 12 + promptLift).toFixed(2)}px, 0) scale(${lerp(1, 0.92, promptFade).toFixed(3)})`;

    if (switcher) {
      switcher.style.transform = `translate3d(-50%, ${(-outroProgress * 10).toFixed(2)}px, 0)`;
    }

    layers.vignette.style.opacity = vignetteOpacity.toFixed(3);

    if (outro) {
      outro.style.opacity = lerp(0.34, 1, easeOutCubic(clamp((progress - 0.72) / 0.28))).toFixed(3);
      outro.style.transform = `translate3d(0, ${lerp(68, 0, outroProgress).toFixed(2)}px, 0)`;
    }

    stage.style.opacity = lerp(1, 0.94, outroProgress).toFixed(3);
    stage.style.transform =
      `translate3d(0, ${lerp(0, -18, outroProgress).toFixed(2)}px, 0) ` +
      `scale(${lerp(1, 0.98, outroProgress).toFixed(3)})`;

    shell.style.setProperty("--detail-intro-opacity", (1 - intro * 0.8).toFixed(3));
  };

  const handlePointerMove = (event) => {
    const x = ((event.clientX - stageBounds.left) / stageBounds.width) * 2 - 1;
    const y = ((event.clientY - stageBounds.top) / stageBounds.height) * 2 - 1;

    state.targetPointerX = clamp(x, -1, 1);
    state.targetPointerY = clamp(y, -1, 1);
  };

  const handlePointerLeave = () => {
    state.targetPointerX = 0;
    state.targetPointerY = 0;
  };

  const tick = () => {
    updateProgress();
    render(performance.now(), false);
  };

  stage.addEventListener("pointermove", handlePointerMove);
  stage.addEventListener("pointerleave", handlePointerLeave);
  stage.addEventListener("pointercancel", handlePointerLeave);
  window.addEventListener("blur", handlePointerLeave);
  window.addEventListener("resize", measure);
  gsap.ticker.add(tick);

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => {
      measure();
    });

    resizeObserver.observe(root);
    resizeObserver.observe(stage);
  }

  measure();
  updateProgress();
  render();
}
