import * as THREE from "/public/vendor/three/three.module.js";
import { disposeObject3D as disposeObject } from "./three-utils.js";

function createSurfaceMaterial({
  color,
  emissive = "#050915",
  emissiveIntensity = 0.2,
  metalness = 0.3,
  roughness = 0.78,
  clearcoat = 0.24,
  clearcoatRoughness = 0.74,
  opacity = 1,
} = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    emissive,
    emissiveIntensity,
    metalness,
    roughness,
    clearcoat,
    clearcoatRoughness,
    transparent: opacity < 1,
    opacity,
    side: THREE.DoubleSide,
  });
}

function createPlane({
  width,
  height,
  position,
  rotation,
  material,
} = {}) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);

  mesh.position.copy(position);
  mesh.rotation.set(rotation.x, rotation.y, rotation.z);

  return mesh;
}

function createThinBox({
  size,
  position,
  rotation = new THREE.Euler(),
  material,
} = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material);

  mesh.position.copy(position);
  mesh.rotation.set(rotation.x, rotation.y, rotation.z);

  return mesh;
}

function createFrame({
  width,
  height,
  depth = 0.12,
  thickness = 0.12,
  position,
  color = "#8fa7ff",
  emissive = "#5c75ff",
  opacity = 0.58,
} = {}) {
  const frame = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.48,
    metalness: 0.48,
    roughness: 0.34,
    transparent: opacity < 1,
    opacity,
  });

  const top = createThinBox({
    size: new THREE.Vector3(width, thickness, depth),
    position: new THREE.Vector3(0, height * 0.5, 0),
    material,
  });
  const bottom = createThinBox({
    size: new THREE.Vector3(width, thickness, depth),
    position: new THREE.Vector3(0, height * -0.5, 0),
    material,
  });
  const left = createThinBox({
    size: new THREE.Vector3(thickness, height, depth),
    position: new THREE.Vector3(width * -0.5, 0, 0),
    material,
  });
  const right = createThinBox({
    size: new THREE.Vector3(thickness, height, depth),
    position: new THREE.Vector3(width * 0.5, 0, 0),
    material,
  });

  frame.add(top, bottom, left, right);
  frame.position.copy(position);

  return frame;
}

function addMotionTarget(targets, object, config) {
  targets.push({
    object,
    basePosition: object.position.clone(),
    baseRotation: object.rotation.clone(),
    swayX: config.swayX ?? 0,
    swayY: config.swayY ?? 0,
    swayZ: config.swayZ ?? 0,
    pointerX: config.pointerX ?? 0,
    pointerY: config.pointerY ?? 0,
    rotX: config.rotX ?? 0,
    rotY: config.rotY ?? 0,
    rotZ: config.rotZ ?? 0,
    speed: config.speed ?? 1,
    phase: config.phase ?? 0,
  });
}

function createTechStripGroup({
  configs,
  color = "#6d82d8",
  emissive = "#8aa0ff",
  opacity = 0.74,
} = {}) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.16,
    metalness: 0.5,
    roughness: 0.46,
    transparent: opacity < 1,
    opacity,
  });

  configs.forEach((config) => {
    group.add(
      createThinBox({
        size: config.size,
        position: config.position,
        rotation: config.rotation,
        material,
      }),
    );
  });

  return group;
}

function createNodeField({
  points,
  radius = 0.06,
  color = "#dbe5ff",
  emissive = "#8eb1ff",
  emissiveIntensity = 0.65,
} = {}) {
  const group = new THREE.Group();
  const geometry = new THREE.SphereGeometry(radius, 12, 12);
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity,
    metalness: 0.82,
    roughness: 0.28,
  });

  points.forEach((point) => {
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.copy(point);
    group.add(mesh);
  });

  return group;
}

function createFloatingPanel({
  width,
  height,
  depth,
  color,
  emissive,
  position,
  rotation,
  opacity = 0.92,
  edgeColor,
} = {}) {
  const group = new THREE.Group();
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshPhysicalMaterial({
      color,
      emissive,
      emissiveIntensity: 0.26,
      metalness: 0.42,
      roughness: 0.18,
      transmission: 0.08,
      transparent: true,
      opacity,
      clearcoat: 0.92,
      clearcoatRoughness: 0.14,
    }),
  );
  const rim = createFrame({
    width: width * 0.96,
    height: height * 0.96,
    depth: depth * 0.9,
    thickness: Math.max(0.06, depth * 0.45),
    position: new THREE.Vector3(0, 0, depth * 0.55),
    color: edgeColor || "#b8d8ff",
    emissive: edgeColor || "#8dc5ff",
    opacity: 0.72,
  });

  group.add(panel, rim);
  group.position.copy(position);
  group.rotation.set(rotation.x, rotation.y, rotation.z);

  return group;
}

function createRoom() {
  const scene = new THREE.Group();
  const motionTargets = [];

  const shell = new THREE.Group();
  const backWall = createPlane({
    width: 17.6,
    height: 10.6,
    position: new THREE.Vector3(0, 0.2, -6.4),
    rotation: new THREE.Euler(0, 0, 0),
    material: createSurfaceMaterial({
      color: "#070c17",
      emissive: "#07101f",
      roughness: 0.9,
      metalness: 0.18,
      clearcoat: 0.08,
    }),
  });
  const floor = createPlane({
    width: 21,
    height: 16,
    position: new THREE.Vector3(0, -4.9, -1.2),
    rotation: new THREE.Euler(-Math.PI * 0.5, 0, 0),
    material: createSurfaceMaterial({
      color: "#050913",
      emissive: "#050813",
      roughness: 0.72,
      metalness: 0.42,
      clearcoat: 0.2,
      opacity: 0.96,
    }),
  });
  const ceiling = createPlane({
    width: 21,
    height: 12,
    position: new THREE.Vector3(0, 4.8, -1.2),
    rotation: new THREE.Euler(Math.PI * 0.5, 0, 0),
    material: createSurfaceMaterial({
      color: "#060a14",
      emissive: "#0a1324",
      roughness: 0.82,
      metalness: 0.22,
      clearcoat: 0.12,
      opacity: 0.92,
    }),
  });
  const leftWall = createPlane({
    width: 16,
    height: 10.8,
    position: new THREE.Vector3(-8.4, 0.1, -1.6),
    rotation: new THREE.Euler(0, Math.PI * 0.5, 0),
    material: createSurfaceMaterial({
      color: "#09101d",
      emissive: "#081122",
      roughness: 0.84,
      metalness: 0.24,
      opacity: 0.9,
    }),
  });
  const rightWall = createPlane({
    width: 16,
    height: 10.8,
    position: new THREE.Vector3(8.4, 0.1, -1.6),
    rotation: new THREE.Euler(0, -Math.PI * 0.5, 0),
    material: createSurfaceMaterial({
      color: "#080f1c",
      emissive: "#08101f",
      roughness: 0.84,
      metalness: 0.26,
      opacity: 0.88,
    }),
  });

  shell.add(backWall, floor, ceiling, leftWall, rightWall);
  scene.add(shell);

  const portalGroup = new THREE.Group();
  [
    { width: 9.8, height: 6.6, z: -5.45, opacity: 0.26 },
    { width: 8.4, height: 5.6, z: -4.05, opacity: 0.34 },
    { width: 6.9, height: 4.6, z: -2.75, opacity: 0.42 },
  ].forEach((frame, index) => {
    const mesh = createFrame({
      width: frame.width,
      height: frame.height,
      depth: 0.14,
      thickness: 0.11 + index * 0.01,
      position: new THREE.Vector3(0, 0.12 + index * 0.08, frame.z),
      color: index === 2 ? "#9fc0ff" : "#6d84dc",
      emissive: index === 2 ? "#92b3ff" : "#5f75d2",
      opacity: frame.opacity,
    });

    portalGroup.add(mesh);
  });

  const backCore = createFloatingPanel({
    width: 4.2,
    height: 2.5,
    depth: 0.24,
    color: "#0d1730",
    emissive: "#193d7b",
    edgeColor: "#80d0ff",
    position: new THREE.Vector3(-0.2, 0.55, -3.2),
    rotation: new THREE.Euler(-0.03, 0.08, 0.01),
    opacity: 0.72,
  });
  const sideBrace = createFloatingPanel({
    width: 0.9,
    height: 2.1,
    depth: 0.2,
    color: "#7558ff",
    emissive: "#8b76ff",
    edgeColor: "#c0a9ff",
    position: new THREE.Vector3(1.76, 0.52, -2.88),
    rotation: new THREE.Euler(0.04, -0.18, -0.03),
    opacity: 0.86,
  });
  const topChip = createFloatingPanel({
    width: 1.38,
    height: 1.84,
    depth: 0.22,
    color: "#f0af57",
    emissive: "#f39a41",
    edgeColor: "#ffe3ba",
    position: new THREE.Vector3(0.3, 1.86, -3.7),
    rotation: new THREE.Euler(0.02, 0.12, 0.01),
    opacity: 0.92,
  });

  portalGroup.add(backCore, sideBrace, topChip);
  scene.add(portalGroup);
  addMotionTarget(motionTargets, portalGroup, {
    pointerX: -0.18,
    pointerY: 0.03,
    swayX: 0.06,
    swayY: 0.04,
    rotY: 0.07,
    rotX: 0.018,
    speed: 0.9,
    phase: 0.1,
  });

  const floorTraces = createTechStripGroup({
    configs: [
      { size: new THREE.Vector3(9.4, 0.05, 0.08), position: new THREE.Vector3(-1.1, -4.72, -0.2), rotation: new THREE.Euler(-Math.PI * 0.5, 0.14, 0) },
      { size: new THREE.Vector3(5.8, 0.04, 0.08), position: new THREE.Vector3(3.3, -4.7, -2.2), rotation: new THREE.Euler(-Math.PI * 0.5, -0.24, 0) },
      { size: new THREE.Vector3(4.2, 0.04, 0.08), position: new THREE.Vector3(-4.3, -4.68, -3.2), rotation: new THREE.Euler(-Math.PI * 0.5, 0.3, 0) },
      { size: new THREE.Vector3(3.1, 0.05, 0.08), position: new THREE.Vector3(5.2, -4.66, -4.6), rotation: new THREE.Euler(-Math.PI * 0.5, -0.18, 0) },
      { size: new THREE.Vector3(2.7, 0.03, 0.08), position: new THREE.Vector3(-0.5, -4.69, -5.3), rotation: new THREE.Euler(-Math.PI * 0.5, 0.08, 0) },
    ],
    color: "#5a6ca9",
    emissive: "#7f97ff",
    opacity: 0.72,
  });
  const leftTraces = createTechStripGroup({
    configs: [
      { size: new THREE.Vector3(0.08, 0.04, 3.5), position: new THREE.Vector3(-8.02, 1.9, -3.6), rotation: new THREE.Euler(0, Math.PI * 0.5, 0.1) },
      { size: new THREE.Vector3(0.08, 0.04, 2.8), position: new THREE.Vector3(-8.02, -0.9, -2.6), rotation: new THREE.Euler(0, Math.PI * 0.5, -0.18) },
      { size: new THREE.Vector3(0.08, 0.04, 2.2), position: new THREE.Vector3(-8.02, -2.3, -4.8), rotation: new THREE.Euler(0, Math.PI * 0.5, 0.16) },
      { size: new THREE.Vector3(0.08, 0.04, 1.6), position: new THREE.Vector3(-8.04, 2.7, -1.2), rotation: new THREE.Euler(0, Math.PI * 0.5, 0.08) },
    ],
    color: "#4d5f98",
    emissive: "#7a90ff",
    opacity: 0.54,
  });
  const rightTraces = createTechStripGroup({
    configs: [
      { size: new THREE.Vector3(0.08, 0.04, 3.3), position: new THREE.Vector3(8.02, 1.1, -2.8), rotation: new THREE.Euler(0, -Math.PI * 0.5, -0.12) },
      { size: new THREE.Vector3(0.08, 0.04, 2.6), position: new THREE.Vector3(8.02, -1.6, -4.1), rotation: new THREE.Euler(0, -Math.PI * 0.5, 0.18) },
      { size: new THREE.Vector3(0.08, 0.04, 1.9), position: new THREE.Vector3(8.04, 2.6, -4.8), rotation: new THREE.Euler(0, -Math.PI * 0.5, 0.14) },
      { size: new THREE.Vector3(0.08, 0.04, 1.2), position: new THREE.Vector3(8.02, -2.6, -1.4), rotation: new THREE.Euler(0, -Math.PI * 0.5, -0.08) },
    ],
    color: "#445485",
    emissive: "#86a0ff",
    opacity: 0.52,
  });
  const backTraces = createTechStripGroup({
    configs: [
      { size: new THREE.Vector3(4.8, 0.04, 0.08), position: new THREE.Vector3(-2.6, 2.4, -6.08), rotation: new THREE.Euler(0.02, 0.08, 0) },
      { size: new THREE.Vector3(3.8, 0.04, 0.08), position: new THREE.Vector3(2.9, 1.1, -6.06), rotation: new THREE.Euler(-0.02, -0.1, 0) },
      { size: new THREE.Vector3(5.2, 0.04, 0.08), position: new THREE.Vector3(0.8, -1.8, -6.04), rotation: new THREE.Euler(0.01, 0.16, 0) },
      { size: new THREE.Vector3(2.6, 0.04, 0.08), position: new THREE.Vector3(4.5, -2.7, -6.03), rotation: new THREE.Euler(0.01, -0.08, 0) },
    ],
    color: "#5f71ae",
    emissive: "#9bb4ff",
    opacity: 0.56,
  });

  scene.add(floorTraces, leftTraces, rightTraces, backTraces);

  const nodes = createNodeField({
    points: [
      new THREE.Vector3(-4.4, -4.62, -3.14),
      new THREE.Vector3(-4.9, -4.62, -2.72),
      new THREE.Vector3(2.9, -4.65, -2.28),
      new THREE.Vector3(3.35, -4.65, -2.54),
      new THREE.Vector3(4.95, -4.62, -4.52),
      new THREE.Vector3(-7.96, 1.92, -3.56),
      new THREE.Vector3(-7.96, 1.5, -3.1),
      new THREE.Vector3(7.96, 1.08, -2.76),
      new THREE.Vector3(7.96, 0.62, -2.22),
      new THREE.Vector3(2.92, 1.1, -6.01),
      new THREE.Vector3(3.38, 1.1, -5.82),
      new THREE.Vector3(-2.18, 2.4, -6.03),
      new THREE.Vector3(-1.76, 2.4, -5.88),
    ],
  });
  scene.add(nodes);

  const sidePanels = new THREE.Group();
  [
    {
      width: 3.8,
      height: 4.4,
      depth: 0.18,
      color: "#0a1225",
      emissive: "#0c1b36",
      edgeColor: "#8ca8ff",
      position: new THREE.Vector3(-5.62, -0.12, -2.5),
      rotation: new THREE.Euler(0.04, 0.84, 0.04),
    },
    {
      width: 2.6,
      height: 3.8,
      depth: 0.16,
      color: "#0a1022",
      emissive: "#112242",
      edgeColor: "#b1c2ff",
      position: new THREE.Vector3(5.34, 0.46, -3.3),
      rotation: new THREE.Euler(-0.04, -0.72, -0.03),
    },
    {
      width: 2.1,
      height: 1.08,
      depth: 0.15,
      color: "#1a284d",
      emissive: "#204f95",
      edgeColor: "#6cc8ff",
      position: new THREE.Vector3(3.18, -1.24, -2.02),
      rotation: new THREE.Euler(-0.02, -0.22, 0.02),
      opacity: 0.82,
    },
  ].forEach((panel, index) => {
    const mesh = createFloatingPanel(panel);

    sidePanels.add(mesh);
    addMotionTarget(motionTargets, mesh, {
      pointerX: index === 0 ? 0.14 : -0.12,
      pointerY: 0.02,
      swayX: 0.04 + index * 0.02,
      swayY: 0.03,
      swayZ: 0.04,
      rotY: index === 0 ? -0.04 : 0.05,
      rotX: 0.01,
      speed: 0.72 + index * 0.22,
      phase: index * 0.8,
    });
  });
  scene.add(sidePanels);

  const lightBars = new THREE.Group();
  [
    { size: new THREE.Vector3(5.2, 0.08, 0.08), position: new THREE.Vector3(-2.2, 3.86, -3.1), rotation: new THREE.Euler(0, 0, 0.1), opacity: 0.38 },
    { size: new THREE.Vector3(3.1, 0.08, 0.08), position: new THREE.Vector3(3.2, 3.52, -2.7), rotation: new THREE.Euler(0, 0, -0.18), opacity: 0.28 },
    { size: new THREE.Vector3(4.6, 0.08, 0.08), position: new THREE.Vector3(0.4, -3.68, -4.7), rotation: new THREE.Euler(0.08, 0.04, 0), opacity: 0.2 },
  ].forEach((bar) => {
    lightBars.add(
      createThinBox({
        size: bar.size,
        position: bar.position,
        rotation: bar.rotation,
        material: new THREE.MeshBasicMaterial({
          color: "#b6d3ff",
          transparent: true,
          opacity: bar.opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      }),
    );
  });
  scene.add(lightBars);

  const volumeGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 8.2),
    new THREE.MeshBasicMaterial({
      color: "#5678ff",
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );

  volumeGlow.position.set(-0.3, 0.4, -3.8);
  scene.add(volumeGlow);

  scene.position.set(0, -0.18, 0);
  addMotionTarget(motionTargets, scene, {
    pointerX: -0.12,
    pointerY: 0.02,
    swayX: 0.03,
    swayY: 0.02,
    rotY: 0.03,
    rotX: 0.01,
    speed: 0.5,
    phase: 0,
  });

  return { room: scene, motionTargets };
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

export function initSchablonenRoomScene({ reduceMotion = false } = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const root = document.querySelector("[data-scene-root]");
  const stage = document.querySelector("[data-scene-stage]");
  const background = document.querySelector('.scene-background--schablonen[data-scene-bg="schablonen"]');

  if (!root || !stage || !background) {
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
    background.dataset.sceneState = "unavailable";
    showSceneFallback(background, "3D-Szene nicht verfügbar");
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.domElement.className = "schablonen-room-canvas";
  background.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2("#020611", 0.064);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  camera.position.set(0, 0.28, 8.4);

  const ambientLight = new THREE.AmbientLight("#88a0ff", 0.92);
  const hemisphereLight = new THREE.HemisphereLight("#dbe6ff", "#020611", 1.26);
  const keyLight = new THREE.DirectionalLight("#eff4ff", 2.2);
  const fillLight = new THREE.PointLight("#6e95ff", 13, 28, 2.2);
  const rimLight = new THREE.PointLight("#b4c6ff", 10, 22, 2);
  const floorLight = new THREE.PointLight("#3858c9", 8, 18, 2.4);

  keyLight.position.set(-3.4, 4.2, 6.8);
  fillLight.position.set(4.8, 0.4, 3.8);
  rimLight.position.set(-5.8, 1.8, -0.4);
  floorLight.position.set(0.2, -3.7, -1.6);

  scene.add(ambientLight, hemisphereLight, keyLight, fillLight, rimLight, floorLight);

  const roomSetup = createRoom();
  const room = roomSetup.room;
  const motionTargets = roomSetup.motionTargets;

  scene.add(room);

  let animationFrameId = 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;

  const resizeRenderer = () => {
    const bounds = background.getBoundingClientRect();
    const width = Math.max(1, Math.floor(bounds.width * 1.06));
    const height = Math.max(1, Math.floor(bounds.height * 1.12));

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const onPointerMove = (event) => {
    const rect = stage.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return;
    }

    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;

    targetX = Math.max(-0.6, Math.min(0.6, x * 0.6));
    targetY = 0;
  };

  const onPointerLeave = () => {
    targetX = 0;
    targetY = 0;
  };

  const animate = (time) => {
    animationFrameId = window.requestAnimationFrame(animate);

    const active = root.dataset.scene === "schablonen" && background.classList.contains("is-active");

    if (!active) {
      return;
    }

    pointerX += (targetX - pointerX) * 0.042;
    pointerY += (targetY - pointerY) * 0.035;

    const idleWave = reduceMotion ? 0 : Math.sin(time * 0.00022) * 0.12;
    const idleLift = reduceMotion ? 0 : Math.cos(time * 0.00018) * 0.08;

    camera.position.x = pointerX * 0.94 + idleWave * 0.18;
    camera.position.y = 0.28 + pointerY * 0.46 + idleLift * 0.08;
    camera.position.z = 8.4 - Math.abs(pointerX) * 0.16;
    camera.lookAt(pointerX * 0.8, pointerY * 0.18, -2.9);
    camera.rotation.z = pointerX * -0.012;

    motionTargets.forEach((motion) => {
      const wave = reduceMotion ? 0 : Math.sin(time * 0.00084 * motion.speed + motion.phase);
      const lift = reduceMotion ? 0 : Math.cos(time * 0.00072 * motion.speed + motion.phase);

      motion.object.position.x = motion.basePosition.x + pointerX * motion.pointerX + wave * motion.swayX;
      motion.object.position.y = motion.basePosition.y + pointerY * motion.pointerY + lift * motion.swayY;
      motion.object.position.z = motion.basePosition.z + wave * motion.swayZ;
      motion.object.rotation.x = motion.baseRotation.x + pointerY * motion.rotX + lift * motion.rotX * 0.45;
      motion.object.rotation.y = motion.baseRotation.y + pointerX * motion.rotY + wave * motion.rotY * 0.3;
      motion.object.rotation.z = motion.baseRotation.z + pointerX * motion.rotZ;
    });

    renderer.render(scene, camera);
  };

  const disposeResources = () => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener("resize", resizeRenderer);
    stage.removeEventListener("pointermove", onPointerMove);
    stage.removeEventListener("pointerleave", onPointerLeave);
    stage.removeEventListener("pointercancel", onPointerLeave);
    window.removeEventListener("pagehide", disposeResources);
    disposeObject(room);
    renderer.dispose();
    renderer.domElement.remove();
  };

  resizeRenderer();
  background.dataset.sceneState = "ready";

  window.addEventListener("resize", resizeRenderer);
  stage.addEventListener("pointermove", onPointerMove);
  stage.addEventListener("pointerleave", onPointerLeave);
  stage.addEventListener("pointercancel", onPointerLeave);
  window.addEventListener("pagehide", disposeResources);

  animate(0);
}
