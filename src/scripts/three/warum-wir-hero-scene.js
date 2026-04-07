import * as THREE from "three";
import {
  createNightSkyWorld,
  disposeObject,
  loadNightSkyBustTexture,
} from "./night-sky-world.js";
import { clamp } from "./three-utils.js";

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function showSceneFallback(container, label = "3D-Szene nicht verfügbar") {
  if (!container || container.querySelector(".scene-error-fallback")) {
    return;
  }

  if (getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }

  const el = document.createElement("div");
  el.className = "scene-error-fallback";
  el.setAttribute("aria-label", label);
  el.innerHTML =
    `<span class="scene-error-fallback__icon" aria-hidden="true">◇</span>` +
    `<span>${label}</span>`;
  container.appendChild(el);
}

export function initWarumWirHeroScene({ reduceMotion = false } = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const root = document.querySelector("[data-why-hero-scene]");
  const canvasHost = root?.querySelector("[data-why-hero-canvas]");

  if (!root || !canvasHost) {
    return;
  }

  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    root.dataset.sceneState = "unavailable";
    showSceneFallback(canvasHost, "3D-Hintergrund nicht verfügbar");
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.domElement.className = "warum-hero-stage__webgl";
  canvasHost.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2("#03050d", 0.052);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);

  const ambientLight = new THREE.AmbientLight("#7a8eff", 0.78);
  const hemisphereLight = new THREE.HemisphereLight("#e8edff", "#03050d", 1.24);
  const keyLight = new THREE.DirectionalLight("#f4f7ff", 2.4);
  const fillLight = new THREE.PointLight("#6985ff", 16, 18, 2.1);
  const rimLight = new THREE.PointLight("#a6b8ff", 10, 18, 2);
  const floorLight = new THREE.PointLight("#3154d2", 12, 18, 2.2);

  keyLight.position.set(-3.2, 4.8, 7.4);
  fillLight.position.set(3.6, 1.4, 4.8);
  rimLight.position.set(-4.6, 2.1, -0.4);
  floorLight.position.set(0, -1.9, 1.2);

  scene.add(ambientLight, hemisphereLight, keyLight, fillLight, rimLight, floorLight);

  const { world, motionTargets, imageMaterial } = createNightSkyWorld();
  scene.add(world);

  let animationFrameId = 0;
  let resizeObserver = null;
  let intersectionObserver = null;
  let isVisible = true;
  let stageBounds = root.getBoundingClientRect();
  const pointer = { x: 0, y: 0 };
  const targetPointer = { x: 0, y: 0 };
  const introStartedAt = performance.now();
  const releaseBustTexture = loadNightSkyBustTexture({ renderer, material: imageMaterial });

  const resizeRenderer = () => {
    stageBounds = root.getBoundingClientRect();

    const width = Math.max(1, Math.floor(stageBounds.width));
    const height = Math.max(1, Math.floor(stageBounds.height));

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const handlePointerMove = (event) => {
    if (reduceMotion) {
      return;
    }

    const x = ((event.clientX - stageBounds.left) / Math.max(stageBounds.width, 1)) * 2 - 1;
    const y = ((event.clientY - stageBounds.top) / Math.max(stageBounds.height, 1)) * 2 - 1;

    targetPointer.x = clamp(x, -1, 1);
    targetPointer.y = clamp(-y, -1, 1);
  };

  const handlePointerLeave = () => {
    targetPointer.x = 0;
    targetPointer.y = 0;
  };

  const render = (time) => {
    animationFrameId = window.requestAnimationFrame(render);

    if (!isVisible) {
      return;
    }

    const introProgress = reduceMotion ? 1 : clamp((time - introStartedAt) / 1400, 0, 1);
    const intro = easeOutCubic(introProgress);

    pointer.x += (targetPointer.x - pointer.x) * (reduceMotion ? 0.12 : 0.058);
    pointer.y += (targetPointer.y - pointer.y) * (reduceMotion ? 0.12 : 0.058);

    const idleWave = reduceMotion ? 0 : Math.sin(time * 0.00032) * 0.12;
    const idleLift = reduceMotion ? 0 : Math.cos(time * 0.00022) * 0.08;
    const lookX = pointer.x * 0.22;

    root.style.setProperty("--why-hero-light-x", `${(50 + pointer.x * 9).toFixed(2)}%`);
    root.style.setProperty("--why-hero-light-y", `${(28 - pointer.y * 7).toFixed(2)}%`);

    camera.position.x = Math.sin(lookX) * 1.62 + idleWave * 0.3;
    camera.position.y = 0.76 + pointer.y * 0.58 + idleLift * 0.28 + (1 - intro) * 0.42;
    camera.position.z = 8.92 + (1 - intro) * 1.5 - Math.abs(pointer.x) * 0.22;
    camera.lookAt(pointer.x * 0.55, 0.88 + pointer.y * 0.24, -1.22);
    camera.rotation.z = pointer.x * -0.018;

    world.position.y = -0.32 + intro * 0.3 + idleLift * 0.12;
    world.rotation.x = pointer.y * -0.08 + idleLift * 0.035 - (1 - intro) * 0.03;
    world.rotation.y = pointer.x * 0.13 + idleWave * 0.055 + (1 - intro) * 0.1;
    world.rotation.z = pointer.x * -0.018;

    motionTargets.forEach((motion) => {
      const wave = reduceMotion ? 0 : Math.sin(time * 0.00074 * motion.speed + motion.phase);
      const lift = reduceMotion ? 0 : Math.cos(time * 0.00062 * motion.speed + motion.phase);

      motion.object.position.x = motion.basePosition.x + pointer.x * motion.pointerX + wave * motion.swayX;
      motion.object.position.y = motion.basePosition.y + pointer.y * motion.pointerY + lift * motion.swayY;
      motion.object.position.z = motion.basePosition.z + wave * motion.swayZ;
      motion.object.rotation.x = motion.baseRotation.x + pointer.y * motion.rotX + lift * motion.rotX * 0.4;
      motion.object.rotation.y = motion.baseRotation.y + pointer.x * motion.rotY + wave * motion.rotY * 0.28;
      motion.object.rotation.z = motion.baseRotation.z + pointer.x * motion.rotZ;
    });

    renderer.render(scene, camera);
  };

  const disposeScene = () => {
    cancelAnimationFrame(animationFrameId);
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    window.removeEventListener("resize", resizeRenderer);
    window.removeEventListener("blur", handlePointerLeave);
    window.removeEventListener("pagehide", disposeScene);
    root.removeEventListener("pointermove", handlePointerMove);
    root.removeEventListener("pointerleave", handlePointerLeave);
    root.removeEventListener("pointercancel", handlePointerLeave);
    releaseBustTexture();
    disposeObject(world);
    renderer.dispose();
    renderer.domElement.remove();
  };

  resizeRenderer();
  root.dataset.sceneState = "ready";

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => {
      resizeRenderer();
    });

    resizeObserver.observe(root);
  }

  if ("IntersectionObserver" in window) {
    intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry?.isIntersecting ?? true;
      },
      {
        rootMargin: "160px",
      },
    );

    intersectionObserver.observe(root);
  }

  root.addEventListener("pointermove", handlePointerMove);
  root.addEventListener("pointerleave", handlePointerLeave);
  root.addEventListener("pointercancel", handlePointerLeave);
  window.addEventListener("resize", resizeRenderer);
  window.addEventListener("blur", handlePointerLeave);
  window.addEventListener("pagehide", disposeScene);

  render(introStartedAt);
}
