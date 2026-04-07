import * as THREE from "/public/vendor/three/three.module.js";
import { disposeObject } from "./night-sky-world.js";
import { clamp } from "./three-utils.js";

const DEFAULT_ASSET_MAX_DIMENSION = 6.6;
const DEFAULT_EMBEDDED_CAMERA_LOOK_DISTANCE = 4.2;
const WORLD_UP = new THREE.Vector3(0, 1, 0);

function parsePositiveNumber(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function findEmbeddedPerspectiveCamera(root) {
  let embeddedCamera = null;

  root?.traverse((child) => {
    if (!embeddedCamera && child.isPerspectiveCamera) {
      embeddedCamera = child;
    }
  });

  return embeddedCamera;
}

function buildEmbeddedCameraState(cameraNode, lookDistance = DEFAULT_EMBEDDED_CAMERA_LOOK_DISTANCE) {
  const position = cameraNode.getWorldPosition(new THREE.Vector3());
  const quaternion = cameraNode.getWorldQuaternion(new THREE.Quaternion());
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion).normalize();
  const right = new THREE.Vector3().crossVectors(forward, WORLD_UP);

  if (right.lengthSq() < 0.0001) {
    right.set(1, 0, 0);
  } else {
    right.normalize();
  }

  const up = new THREE.Vector3().crossVectors(right, forward).normalize();
  const distance = Math.max(lookDistance, 0.001);

  return {
    mode: "asset",
    position,
    target: position.clone().addScaledVector(forward, distance),
    right,
    up,
    positionShiftX: Math.min(Math.max(distance * 0.03, 0.08), 0.32),
    positionShiftY: Math.min(Math.max(distance * 0.018, 0.06), 0.22),
    targetShiftX: Math.min(Math.max(distance * 0.11, 0.22), 0.72),
    targetShiftY: Math.min(Math.max(distance * 0.06, 0.12), 0.42),
    rollFactor: 0.012,
    fov: cameraNode.fov,
    near: cameraNode.near,
    far: cameraNode.far,
  };
}

function addMotionTarget(targets, object, config = {}) {
  targets.push({
    object,
    basePosition: object.position.clone(),
    baseRotation: object.rotation.clone(),
    pointerX: config.pointerX ?? 0,
    pointerY: config.pointerY ?? 0,
    swayX: config.swayX ?? 0,
    swayY: config.swayY ?? 0,
    swayZ: config.swayZ ?? 0,
    rotX: config.rotX ?? 0,
    rotY: config.rotY ?? 0,
    rotZ: config.rotZ ?? 0,
    speed: config.speed ?? 1,
    phase: config.phase ?? 0,
  });
}

function createOrbitStarfield({ count = 520, radius = 15.2 } = {}) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
    const distance = radius + THREE.MathUtils.randFloatSpread(2.4);
    const tone = 0.7 + Math.random() * 0.3;

    positions[index * 3] = Math.sin(phi) * Math.cos(theta) * distance;
    positions[index * 3 + 1] = Math.cos(phi) * distance * 0.72;
    positions[index * 3 + 2] = Math.sin(phi) * Math.sin(theta) * distance;

    colors[index * 3] = tone * 0.78;
    colors[index * 3 + 1] = tone * 0.86;
    colors[index * 3 + 2] = tone;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.08,
      transparent: true,
      opacity: 0.94,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
}

function createLookAroundShell() {
  const shell = new THREE.Group();

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(16.4, 56, 36),
    new THREE.MeshBasicMaterial({
      color: "#040915",
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.98,
    }),
  );
  shell.add(dome);

  const haze = new THREE.Mesh(
    new THREE.SphereGeometry(14.9, 48, 26),
    new THREE.MeshBasicMaterial({
      color: "#2f57cd",
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  haze.scale.set(1.14, 0.68, 1.14);
  haze.position.y = 1.1;
  shell.add(haze);

  const orbitRing = new THREE.Mesh(
    new THREE.TorusGeometry(8.6, 0.12, 16, 120),
    new THREE.MeshBasicMaterial({
      color: "#6b84ff",
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  orbitRing.rotation.x = Math.PI * 0.5;
  orbitRing.position.y = -1.56;
  shell.add(orbitRing);

  const highRing = orbitRing.clone();
  highRing.scale.setScalar(0.72);
  highRing.position.y = 2.42;
  highRing.material = highRing.material.clone();
  highRing.material.opacity = 0.09;
  shell.add(highRing);

  const starfield = createOrbitStarfield();
  shell.add(starfield);

  return {
    shell,
    orbitRing,
    highRing,
    starfield,
  };
}

function createLookAroundWorld() {
  const world = new THREE.Group();
  const motionTargets = [];

  const platformMaterial = new THREE.MeshPhysicalMaterial({
    color: "#08101f",
    emissive: "#0a1330",
    emissiveIntensity: 0.28,
    metalness: 0.46,
    roughness: 0.34,
    clearcoat: 0.68,
    clearcoatRoughness: 0.14,
  });

  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(4.8, 6.9, 0.92, 12, 1, false),
    platformMaterial,
  );
  platform.position.set(0, -1.92, 0);
  world.add(platform);

  const upperPlatform = new THREE.Mesh(
    new THREE.CylinderGeometry(2.8, 3.6, 0.24, 12, 1, false),
    new THREE.MeshPhysicalMaterial({
      color: "#0d1632",
      emissive: "#17265c",
      emissiveIntensity: 0.32,
      metalness: 0.54,
      roughness: 0.22,
      clearcoat: 0.82,
      clearcoatRoughness: 0.12,
    }),
  );
  upperPlatform.position.set(0, -1.24, 0);
  world.add(upperPlatform);

  const floorHalo = new THREE.Mesh(
    new THREE.RingGeometry(2.4, 6.8, 96),
    new THREE.MeshBasicMaterial({
      color: "#6d87ff",
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  floorHalo.rotation.x = -Math.PI * 0.5;
  floorHalo.position.set(0, -1.44, 0);
  world.add(floorHalo);

  const core = new THREE.Group();
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: "#dce6ff",
    emissive: "#8ea7ff",
    emissiveIntensity: 0.62,
    metalness: 0.64,
    roughness: 0.18,
    transparent: true,
    opacity: 0.86,
  });

  [
    { scale: [1, 1, 1], rotation: [0, 0, 0] },
    { scale: [1.08, 1.08, 1.08], rotation: [0.42, 0.62, 0] },
    { scale: [0.86, 0.86, 0.86], rotation: [1.08, 0.14, 0.36] },
  ].forEach((config, index) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2 + index * 0.42, 0.06, 12, 120), coreMaterial);
    ring.scale.set(config.scale[0], config.scale[1], config.scale[2]);
    ring.rotation.set(config.rotation[0], config.rotation[1], config.rotation[2]);
    core.add(ring);
    addMotionTarget(motionTargets, ring, {
      pointerX: 0.12 - index * 0.03,
      pointerY: 0.06,
      swayY: 0.05 + index * 0.02,
      swayZ: 0.05,
      rotX: 0.03,
      rotY: 0.1 + index * 0.03,
      rotZ: 0.08,
      speed: 0.76 + index * 0.16,
      phase: index * 0.42,
    });
  });

  const coreGlow = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 32, 24),
    new THREE.MeshBasicMaterial({
      color: "#7c96ff",
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  coreGlow.scale.set(1.5, 1.1, 1.5);
  core.add(coreGlow);
  core.position.set(0, 0.48, -0.2);
  world.add(core);

  const panelMaterial = new THREE.MeshPhysicalMaterial({
    color: "#101b3e",
    emissive: "#223a86",
    emissiveIntensity: 0.28,
    metalness: 0.28,
    roughness: 0.18,
    clearcoat: 0.78,
    clearcoatRoughness: 0.12,
    transparent: true,
    opacity: 0.42,
  });

  [
    { size: [0.56, 4.8, 0.18], position: [-5.4, 0.78, -4.8], rotation: [0.02, 0.42, 0.08] },
    { size: [0.62, 5.4, 0.18], position: [5.8, 0.82, -4.2], rotation: [-0.04, -0.46, -0.06] },
    { size: [0.48, 4.2, 0.16], position: [-7.1, 0.94, 1.3], rotation: [0.02, 1.24, 0.02] },
    { size: [0.52, 4.4, 0.16], position: [7.2, 1.02, 0.92], rotation: [-0.02, -1.16, -0.02] },
    { size: [0.42, 3.6, 0.14], position: [0.4, 1.34, -7.2], rotation: [0.04, 0.06, 0.02] },
  ].forEach((config, index) => {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(config.size[0], config.size[1], config.size[2]),
      panelMaterial.clone(),
    );

    panel.position.set(config.position[0], config.position[1], config.position[2]);
    panel.rotation.set(config.rotation[0], config.rotation[1], config.rotation[2]);
    panel.material.opacity = 0.24 + index * 0.04;
    world.add(panel);

    addMotionTarget(motionTargets, panel, {
      pointerX: index % 2 === 0 ? -0.16 : 0.16,
      pointerY: 0.08,
      swayX: 0.06,
      swayY: 0.08,
      rotY: index % 2 === 0 ? -0.08 : 0.08,
      rotX: 0.02,
      speed: 0.58 + index * 0.12,
      phase: index * 0.38,
    });
  });

  const skylineMaterial = new THREE.MeshPhysicalMaterial({
    color: "#0b1430",
    emissive: "#162856",
    emissiveIntensity: 0.22,
    metalness: 0.34,
    roughness: 0.3,
    clearcoat: 0.54,
    clearcoatRoughness: 0.16,
  });

  const skyline = new THREE.Group();
  for (let index = 0; index < 10; index += 1) {
    const angle = (index / 10) * Math.PI * 2;
    const radius = 7.8 + (index % 2) * 1.1;
    const height = 1.8 + ((index * 7) % 5) * 0.72;
    const width = 0.46 + (index % 3) * 0.12;
    const depth = 0.42 + ((index + 1) % 3) * 0.1;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      skylineMaterial.clone(),
    );

    mesh.position.set(Math.sin(angle) * radius, -0.74 + height * 0.5, Math.cos(angle) * radius);
    mesh.rotation.y = angle + Math.PI * 0.25;
    mesh.material.emissiveIntensity = 0.16 + (index % 4) * 0.04;
    skyline.add(mesh);

    addMotionTarget(motionTargets, mesh, {
      pointerX: Math.sin(angle) * 0.12,
      pointerY: 0.05,
      swayY: 0.05,
      swayZ: 0.04,
      rotY: 0.05,
      speed: 0.52 + index * 0.05,
      phase: index * 0.24,
    });
  }
  world.add(skyline);

  const prismMaterial = new THREE.MeshStandardMaterial({
    color: "#e5ecff",
    emissive: "#97acff",
    emissiveIntensity: 0.58,
    metalness: 0.68,
    roughness: 0.18,
    transparent: true,
    opacity: 0.88,
  });

  [
    { scale: [0.24, 0.82, 0.24], position: [-4.6, 1.84, -1.6], rotation: [0.68, 0.24, 0.26] },
    { scale: [0.2, 0.68, 0.2], position: [4.2, 1.54, -0.8], rotation: [-0.42, 0.72, -0.18] },
    { scale: [0.22, 0.62, 0.22], position: [-2.2, 0.14, 4.9], rotation: [0.18, -0.48, 0.34] },
    { scale: [0.18, 0.52, 0.18], position: [2.9, 2.38, 3.6], rotation: [-0.24, 0.54, 0.16] },
    { scale: [0.18, 0.42, 0.18], position: [0.2, 3.02, -3.8], rotation: [0.44, -0.34, 0.22] },
  ].forEach((config, index) => {
    const prism = new THREE.Mesh(new THREE.OctahedronGeometry(0.58, 0), prismMaterial);
    prism.scale.set(config.scale[0], config.scale[1], config.scale[2]);
    prism.position.set(config.position[0], config.position[1], config.position[2]);
    prism.rotation.set(config.rotation[0], config.rotation[1], config.rotation[2]);
    world.add(prism);

    addMotionTarget(motionTargets, prism, {
      pointerX: index % 2 === 0 ? -0.12 : 0.12,
      pointerY: 0.08,
      swayX: 0.06,
      swayY: 0.08,
      swayZ: 0.04,
      rotX: 0.08,
      rotY: 0.12,
      rotZ: 0.08,
      speed: 0.92 + index * 0.14,
      phase: 0.6 + index * 0.28,
    });
  });

  const beamMaterial = new THREE.MeshBasicMaterial({
    color: "#dce6ff",
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  [
    { size: [5.8, 0.08, 0.08], position: [-2.2, 2.8, -4.2], rotation: [0.1, 0.2, 0.42] },
    { size: [6.2, 0.08, 0.08], position: [2.6, -0.32, -3.6], rotation: [-0.06, -0.18, -0.22] },
    { size: [4.2, 0.08, 0.08], position: [0.6, 3.24, 1.8], rotation: [0.12, -0.16, 0.14] },
  ].forEach((config, index) => {
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(config.size[0], config.size[1], config.size[2]),
      beamMaterial,
    );
    beam.position.set(config.position[0], config.position[1], config.position[2]);
    beam.rotation.set(config.rotation[0], config.rotation[1], config.rotation[2]);
    world.add(beam);

    addMotionTarget(motionTargets, beam, {
      pointerX: 0.08,
      pointerY: 0.04,
      swayX: 0.04,
      swayY: 0.03,
      rotY: 0.04,
      speed: 0.46 + index * 0.12,
      phase: index * 0.54,
    });
  });

  world.position.set(0, -0.14, 0);

  return {
    world,
    motionTargets,
  };
}

async function loadLookAroundAsset({
  assetUrl,
  anchor,
  lifecycle,
  root,
  assetMaxDimension = DEFAULT_ASSET_MAX_DIMENSION,
  onEmbeddedCamera,
}) {
  if (!assetUrl) {
    root.dataset.assetState = "missing";
    return () => {};
  }

  root.dataset.assetState = "loading";

  try {
    const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
      import("three/addons/loaders/GLTFLoader.js"),
      import("three/addons/loaders/DRACOLoader.js"),
    ]);

    if (lifecycle.disposed) {
      return () => {};
    }

    return await new Promise((resolve) => {
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("/public/vendor/three/draco/gltf/");
      loader.setDRACOLoader(dracoLoader);

      loader.load(
        assetUrl,
        (gltf) => {
          const model = gltf.scene ?? gltf.scenes?.[0];

          if (!model) {
            root.dataset.assetState = "missing";
            dracoLoader.dispose();
            resolve(() => {});
            return;
          }

          if (lifecycle.disposed) {
            dracoLoader.dispose();
            disposeObject(model);
            resolve(() => {});
            return;
          }

          model.updateMatrixWorld(true);

          const bounds = new THREE.Box3().setFromObject(model);

          if (bounds.isEmpty()) {
            root.dataset.assetState = "empty";
            console.warn(`[landing-why-world] ${assetUrl} wurde geladen, enthaelt aber keine sichtbaren Objekte.`);
            dracoLoader.dispose();
            disposeObject(model);
            resolve(() => {});
            return;
          }

          const size = bounds.getSize(new THREE.Vector3());
          const center = bounds.getCenter(new THREE.Vector3());
          const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
          const scale = assetMaxDimension / maxDimension;

          model.position.sub(center);
          model.scale.setScalar(scale);
          model.position.y -= 0.1;

          anchor.add(model);
          model.updateMatrixWorld(true);

          const embeddedCamera = findEmbeddedPerspectiveCamera(model);

          if (embeddedCamera) {
            onEmbeddedCamera?.(
              buildEmbeddedCameraState(
                embeddedCamera,
                Math.max(assetMaxDimension * 0.64, DEFAULT_EMBEDDED_CAMERA_LOOK_DISTANCE),
              ),
            );
            root.dataset.sceneCameraSource = "asset";
          } else {
            root.dataset.sceneCameraSource = "runtime";
          }

          root.dataset.assetState = "ready";
          dracoLoader.dispose();

          resolve(() => {
            anchor.remove(model);
            disposeObject(model);
          });
        },
        undefined,
        (error) => {
          root.dataset.assetState = "unavailable";
          dracoLoader.dispose();
          console.warn(`[landing-why-world] ${assetUrl} konnte nicht geladen werden.`, error);
          resolve(() => {});
        },
      );
    });
  } catch (error) {
    root.dataset.assetState = "unavailable";
    console.warn("[landing-why-world] GLTFLoader konnte nicht initialisiert werden.", error);
    return () => {};
  }
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

export function initLandingWarumWirScene({ reduceMotion = false } = {}) {
  if (typeof window === "undefined" || !document.body.classList.contains("is-landing-reference")) {
    return;
  }

  const sceneRoot = document.querySelector("[data-scene-root]");
  const stage = sceneRoot?.querySelector("[data-scene-stage]");
  const progressScene = document.querySelector('[data-scene-progress="warum-wir"]');
  const root = progressScene?.querySelector("[data-landing-why-world]");
  const canvasHost = root?.querySelector("[data-landing-why-world-canvas]");

  if (!sceneRoot || !stage || !progressScene || !root || !canvasHost) {
    return;
  }

  let animationFrameId = 0;
  let resizeObserver = null;
  let renderer = null;
  let scene = null;
  let camera = null;
  let lookAroundShell = null;
  let lookRig = null;
  let world = null;
  let motionTargets = [];
  let releaseAsset = () => {};
  const lifecycle = { disposed: false };
  let rootBounds = root.getBoundingClientRect();
  const assetUrl = root.dataset.sceneAssetUrl ?? "";
  const assetMaxDimension = parsePositiveNumber(
    root.dataset.sceneAssetMaxDimension,
    DEFAULT_ASSET_MAX_DIMENSION,
  );
  const pointer = { x: 0, y: 0 };
  const targetPointer = { x: 0, y: 0 };
  const cursor = { x: 50, y: 64, scale: 0.86, opacity: 0.46 };
  const targetCursor = { x: 50, y: 64, scale: 0.86, opacity: 0.46 };
  const cameraState = {
    mode: "runtime",
    position: new THREE.Vector3(),
    target: new THREE.Vector3(),
    right: new THREE.Vector3(1, 0, 0),
    up: new THREE.Vector3(0, 1, 0),
    positionShiftX: 0.18,
    positionShiftY: 0.1,
    targetShiftX: 0.72,
    targetShiftY: 0.34,
    rollFactor: 0.018,
    fov: 31,
    near: 0.1,
    far: 50,
  };

  const applyPointerVars = () => {
    root.style.setProperty("--landing-why-pan-x", pointer.x.toFixed(4));
    root.style.setProperty("--landing-why-pan-y", pointer.y.toFixed(4));
    root.style.setProperty("--landing-why-light-x", `${(50 + pointer.x * 14).toFixed(2)}%`);
    root.style.setProperty("--landing-why-light-y", `${(24 - pointer.y * 8).toFixed(2)}%`);
    root.style.setProperty("--landing-why-cursor-x", `${cursor.x.toFixed(2)}%`);
    root.style.setProperty("--landing-why-cursor-y", `${cursor.y.toFixed(2)}%`);
    root.style.setProperty("--landing-why-cursor-scale", cursor.scale.toFixed(3));
    root.style.setProperty("--landing-why-cursor-opacity", cursor.opacity.toFixed(3));
  };

  const setCameraState = (nextState = {}) => {
    cameraState.mode = nextState.mode ?? cameraState.mode;

    if (nextState.position) {
      cameraState.position.copy(nextState.position);
    }

    if (nextState.target) {
      cameraState.target.copy(nextState.target);
    }

    if (nextState.right) {
      cameraState.right.copy(nextState.right);
    }

    if (nextState.up) {
      cameraState.up.copy(nextState.up);
    }

    cameraState.positionShiftX = nextState.positionShiftX ?? cameraState.positionShiftX;
    cameraState.positionShiftY = nextState.positionShiftY ?? cameraState.positionShiftY;
    cameraState.targetShiftX = nextState.targetShiftX ?? cameraState.targetShiftX;
    cameraState.targetShiftY = nextState.targetShiftY ?? cameraState.targetShiftY;
    cameraState.rollFactor = nextState.rollFactor ?? cameraState.rollFactor;
    cameraState.fov = nextState.fov ?? cameraState.fov;
    cameraState.near = nextState.near ?? cameraState.near;
    cameraState.far = nextState.far ?? cameraState.far;
    root.dataset.sceneCameraSource = cameraState.mode;

    if (!camera) {
      return;
    }

    camera.fov = cameraState.fov;
    camera.near = cameraState.near;
    camera.far = Math.max(cameraState.far, cameraState.near + 1);
    camera.updateProjectionMatrix();
  };

  const resizeRenderer = () => {
    rootBounds = root.getBoundingClientRect();

    if (!renderer || !camera) {
      return;
    }

    const width = Math.max(1, Math.floor(rootBounds.width));
    const height = Math.max(1, Math.floor(rootBounds.height));

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const handlePointerEnter = () => {
    if (reduceMotion) {
      return;
    }

    root.dataset.lookState = "active";
    targetCursor.scale = 1;
    targetCursor.opacity = 0.98;
  };

  const handlePointerMove = (event) => {
    if (reduceMotion) {
      return;
    }

    rootBounds = root.getBoundingClientRect();

    const xRatio = (event.clientX - rootBounds.left) / Math.max(rootBounds.width, 1);
    const yRatio = (event.clientY - rootBounds.top) / Math.max(rootBounds.height, 1);
    const x = xRatio * 2 - 1;
    const y = yRatio * 2 - 1;

    targetPointer.x = clamp(x, -1, 1);
    targetPointer.y = clamp(-y, -1, 1);
    targetCursor.x = clamp(xRatio * 100, 8, 92);
    targetCursor.y = clamp(yRatio * 100, 12, 88);
    targetCursor.scale = 1;
    targetCursor.opacity = 0.98;
    root.dataset.lookState = "active";
  };

  const handlePointerLeave = () => {
    targetPointer.x = 0;
    targetPointer.y = 0;
    targetCursor.x = 50;
    targetCursor.y = 64;
    targetCursor.scale = 0.86;
    targetCursor.opacity = 0.46;
    root.dataset.lookState = "idle";
  };

  const animate = (time) => {
    animationFrameId = window.requestAnimationFrame(animate);

    const active =
      sceneRoot.dataset.scene === "warum-wir" &&
      progressScene.classList.contains("is-active");

    if (!active) {
      return;
    }

    pointer.x += (targetPointer.x - pointer.x) * (reduceMotion ? 0.16 : 0.07);
    pointer.y += (targetPointer.y - pointer.y) * (reduceMotion ? 0.16 : 0.07);
    cursor.x += (targetCursor.x - cursor.x) * (reduceMotion ? 0.22 : 0.12);
    cursor.y += (targetCursor.y - cursor.y) * (reduceMotion ? 0.22 : 0.12);
    cursor.scale += (targetCursor.scale - cursor.scale) * (reduceMotion ? 0.22 : 0.12);
    cursor.opacity += (targetCursor.opacity - cursor.opacity) * (reduceMotion ? 0.22 : 0.14);

    applyPointerVars();

    if (!renderer || !scene || !camera || !lookAroundShell || !lookRig || !world) {
      return;
    }

    const idleWave = reduceMotion ? 0 : Math.sin(time * 0.00024) * 0.08;
    const idleLift = reduceMotion ? 0 : Math.cos(time * 0.00018) * 0.06;
    const yaw = THREE.MathUtils.degToRad(pointer.x * 24);
    const pitch = THREE.MathUtils.degToRad(pointer.y * 11);
    const orbitRadius = 8.8;

    if (cameraState.mode === "asset") {
      const dynamicPosition = cameraState.position.clone()
        .addScaledVector(cameraState.right, pointer.x * cameraState.positionShiftX + idleWave * 0.08)
        .addScaledVector(cameraState.up, pointer.y * cameraState.positionShiftY + idleLift * 0.12);
      const dynamicTarget = cameraState.target.clone()
        .addScaledVector(cameraState.right, pointer.x * cameraState.targetShiftX)
        .addScaledVector(cameraState.up, pointer.y * cameraState.targetShiftY + idleLift * 0.06);

      camera.position.copy(dynamicPosition);
      camera.lookAt(dynamicTarget);
      camera.rotation.z = pointer.x * -cameraState.rollFactor;
    } else {
      camera.position.x = Math.sin(yaw) * orbitRadius * 0.82 + idleWave * 0.2;
      camera.position.y = 0.88 + Math.sin(pitch) * 0.96 + idleLift * 0.22;
      camera.position.z = Math.cos(yaw) * orbitRadius + 0.18 - Math.abs(pointer.x) * 0.08;
      camera.lookAt(pointer.x * 0.72, 0.54 + Math.sin(pitch) * 0.34, -0.2);
      camera.rotation.z = pointer.x * -0.018;
    }

    lookAroundShell.shell.rotation.y = -yaw * 0.44 + time * 0.00005;
    lookAroundShell.shell.rotation.x = pitch * 0.08;
    lookAroundShell.orbitRing.rotation.z = time * 0.00008;
    lookAroundShell.highRing.rotation.z = -time * 0.00006;
    lookAroundShell.starfield.rotation.y = time * 0.00006 - yaw * 0.2;

    lookRig.position.y = -0.12 + idleLift * 0.18;
    lookRig.rotation.x = pointer.y * -0.04 + idleLift * 0.04;
    lookRig.rotation.y = Math.sin(yaw) * 0.16 + idleWave * 0.06;
    lookRig.rotation.z = pointer.x * -0.01;

    motionTargets.forEach((motion) => {
      const wave = reduceMotion ? 0 : Math.sin(time * 0.00068 * motion.speed + motion.phase);
      const lift = reduceMotion ? 0 : Math.cos(time * 0.00054 * motion.speed + motion.phase);

      motion.object.position.x = motion.basePosition.x + pointer.x * motion.pointerX + wave * motion.swayX;
      motion.object.position.y = motion.basePosition.y + pointer.y * motion.pointerY + lift * motion.swayY;
      motion.object.position.z = motion.basePosition.z + wave * motion.swayZ;
      motion.object.rotation.x = motion.baseRotation.x + pointer.y * motion.rotX + lift * motion.rotX * 0.42;
      motion.object.rotation.y = motion.baseRotation.y + pointer.x * motion.rotY + wave * motion.rotY * 0.3;
      motion.object.rotation.z = motion.baseRotation.z + pointer.x * motion.rotZ;
    });

    renderer.render(scene, camera);
  };

  root.dataset.sceneState = "fallback";
  root.dataset.lookState = "idle";
  root.dataset.assetState = "idle";
  root.dataset.sceneCameraSource = "runtime";
  applyPointerVars();

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.domElement.className = "landing-why-world__webgl";
    canvasHost.append(renderer.domElement);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#040711", 0.042);

    camera = new THREE.PerspectiveCamera(31, 1, 0.1, 50);
    setCameraState();

    const ambientLight = new THREE.AmbientLight("#7d91ff", 0.92);
    const hemisphereLight = new THREE.HemisphereLight("#eef2ff", "#040711", 1.44);
    const keyLight = new THREE.DirectionalLight("#fbfcff", 3.1);
    const fillLight = new THREE.PointLight("#6f8aff", 20, 22, 2.1);
    const rimLight = new THREE.PointLight("#c4d3ff", 12, 24, 2);
    const floorLight = new THREE.PointLight("#3557d8", 16, 22, 2.3);

    keyLight.position.set(-3.4, 5, 7.8);
    fillLight.position.set(4.8, 1.8, 4.6);
    rimLight.position.set(-5.2, 2.8, -1.6);
    floorLight.position.set(0, -1.7, 1.4);

    scene.add(ambientLight, hemisphereLight, keyLight, fillLight, rimLight, floorLight);

    lookAroundShell = createLookAroundShell();
    scene.add(lookAroundShell.shell);

    lookRig = new THREE.Group();
    const lookAroundWorld = createLookAroundWorld();
    world = lookAroundWorld.world;
    motionTargets = lookAroundWorld.motionTargets;
    lookRig.add(world);

    const assetAnchor = new THREE.Group();
    assetAnchor.position.set(0, 0.34, 0);
    lookRig.add(assetAnchor);

    scene.add(lookRig);
    root.dataset.sceneState = "ready";

    void loadLookAroundAsset({
      assetUrl,
      anchor: assetAnchor,
      lifecycle,
      root,
      assetMaxDimension,
      onEmbeddedCamera: setCameraState,
    }).then((release) => {
      if (lifecycle.disposed) {
        release();
        return;
      }

      releaseAsset = release;
    });
  } catch (error) {
    root.dataset.sceneState = "fallback";
    root.dataset.assetState = "unavailable";
    showSceneFallback(canvasHost, "3D-Szene nicht verfügbar");
  }

  resizeRenderer();

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => {
      resizeRenderer();
    });

    resizeObserver.observe(root);
    resizeObserver.observe(stage);
  }

  const disposeScene = () => {
    lifecycle.disposed = true;
    cancelAnimationFrame(animationFrameId);
    resizeObserver?.disconnect();
    root.removeEventListener("pointerenter", handlePointerEnter);
    root.removeEventListener("pointermove", handlePointerMove);
    root.removeEventListener("pointerleave", handlePointerLeave);
    root.removeEventListener("pointercancel", handlePointerLeave);
    window.removeEventListener("blur", handlePointerLeave);
    window.removeEventListener("resize", resizeRenderer);
    window.removeEventListener("pagehide", disposeScene);
    releaseAsset();

    if (lookAroundShell?.shell) {
      disposeObject(lookAroundShell.shell);
    }

    if (world) {
      disposeObject(world);
    }

    renderer?.dispose();
    renderer?.domElement.remove();
  };

  root.addEventListener("pointerenter", handlePointerEnter);
  root.addEventListener("pointermove", handlePointerMove);
  root.addEventListener("pointerleave", handlePointerLeave);
  root.addEventListener("pointercancel", handlePointerLeave);
  window.addEventListener("blur", handlePointerLeave);
  window.addEventListener("resize", resizeRenderer);
  window.addEventListener("pagehide", disposeScene);

  animate(performance.now());
}
