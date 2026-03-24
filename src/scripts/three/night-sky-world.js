import * as THREE from "/public/vendor/three/three.module.js";

const TEXTURE_KEYS = [
  "alphaMap",
  "aoMap",
  "bumpMap",
  "clearcoatMap",
  "clearcoatNormalMap",
  "clearcoatRoughnessMap",
  "displacementMap",
  "emissiveMap",
  "envMap",
  "lightMap",
  "map",
  "metalnessMap",
  "normalMap",
  "roughnessMap",
  "specularMap",
];

export const NIGHT_SKY_BUST_TEXTURE_URL = "/public/media/images/night-sky-bust-reference.jpg";

function createSurfaceMaterial({
  color,
  emissive = "#08101f",
  emissiveIntensity = 0.16,
  metalness = 0.36,
  roughness = 0.64,
  clearcoat = 0.42,
  clearcoatRoughness = 0.26,
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
  });
}

function createThinBox({ size, position, rotation, material } = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material);

  mesh.position.copy(position);
  mesh.rotation.set(rotation.x, rotation.y, rotation.z);

  return mesh;
}

function createFrame({
  width,
  height,
  depth = 0.12,
  thickness = 0.1,
  position = new THREE.Vector3(),
  color = "#9fb1ff",
  emissive = "#7d8fff",
  opacity = 0.72,
} = {}) {
  const frame = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.46,
    metalness: 0.54,
    roughness: 0.24,
    transparent: opacity < 1,
    opacity,
  });

  const top = createThinBox({
    size: new THREE.Vector3(width, thickness, depth),
    position: new THREE.Vector3(0, height * 0.5, 0),
    rotation: new THREE.Euler(),
    material,
  });
  const bottom = createThinBox({
    size: new THREE.Vector3(width, thickness, depth),
    position: new THREE.Vector3(0, height * -0.5, 0),
    rotation: new THREE.Euler(),
    material,
  });
  const left = createThinBox({
    size: new THREE.Vector3(thickness, height, depth),
    position: new THREE.Vector3(width * -0.5, 0, 0),
    rotation: new THREE.Euler(),
    material,
  });
  const right = createThinBox({
    size: new THREE.Vector3(thickness, height, depth),
    position: new THREE.Vector3(width * 0.5, 0, 0),
    rotation: new THREE.Euler(),
    material,
  });

  frame.add(top, bottom, left, right);
  frame.position.copy(position);

  return frame;
}

function createStarfield({ count = 260 } = {}) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 2.8 + Math.random() * 5.8;
    const spread = (Math.random() - 0.5) * 5.8;
    const height = (Math.random() - 0.15) * 4.8;
    const tone = 0.72 + Math.random() * 0.28;

    positions[index * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.6;
    positions[index * 3 + 1] = height;
    positions[index * 3 + 2] = -4.2 - spread;

    colors[index * 3] = tone * 0.84;
    colors[index * 3 + 1] = tone * 0.9;
    colors[index * 3 + 2] = tone;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.06,
      transparent: true,
      opacity: 0.92,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
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

export function disposeMaterial(material) {
  if (!material) {
    return;
  }

  if (Array.isArray(material)) {
    material.forEach(disposeMaterial);
    return;
  }

  TEXTURE_KEYS.forEach((key) => {
    if (material[key]?.dispose) {
      material[key].dispose();
    }
  });

  material.dispose();
}

export function disposeObject(object) {
  if (!object) {
    return;
  }

  object.traverse((child) => {
    if (child.geometry?.dispose) {
      child.geometry.dispose();
    }

    if (child.material) {
      disposeMaterial(child.material);
    }
  });
}

export function loadNightSkyBustTexture({ renderer, material }) {
  const textureLoader = new THREE.TextureLoader();
  let bustTexture = null;
  let disposed = false;

  textureLoader.load(NIGHT_SKY_BUST_TEXTURE_URL, (texture) => {
    if (disposed) {
      texture.dispose();
      return;
    }

    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(1, 0.84);
    texture.offset.set(0, 0.15);

    bustTexture = texture;
    material.map = texture;
    material.needsUpdate = true;
  });

  return () => {
    disposed = true;
    bustTexture?.dispose();
  };
}

export function createNightSkyWorld() {
  const world = new THREE.Group();
  const motionTargets = [];

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(6.8, 72),
    createSurfaceMaterial({
      color: "#060a15",
      emissive: "#071120",
      emissiveIntensity: 0.24,
      roughness: 0.44,
      metalness: 0.58,
      clearcoat: 0.56,
      clearcoatRoughness: 0.14,
      opacity: 0.98,
    }),
  );
  floor.rotation.x = -Math.PI * 0.5;
  floor.position.set(0, -2.06, -0.54);
  world.add(floor);

  const floorHalo = new THREE.Mesh(
    new THREE.RingGeometry(1.8, 5.8, 96),
    new THREE.MeshBasicMaterial({
      color: "#738bff",
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  floorHalo.rotation.x = -Math.PI * 0.5;
  floorHalo.position.set(0, -2.04, -0.62);
  world.add(floorHalo);

  const backGlow = new THREE.Mesh(
    new THREE.CircleGeometry(3.8, 72),
    new THREE.MeshBasicMaterial({
      color: "#617cff",
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  backGlow.position.set(0, 1.08, -4.92);
  world.add(backGlow);

  const portal = new THREE.Group();

  [
    { width: 5.4, height: 6.4, z: -5.2, opacity: 0.2 },
    { width: 4.6, height: 5.5, z: -4.3, opacity: 0.28 },
    { width: 3.86, height: 4.7, z: -3.44, opacity: 0.42 },
  ].forEach((frame, index) => {
    const mesh = createFrame({
      width: frame.width,
      height: frame.height,
      depth: 0.13,
      thickness: 0.08 + index * 0.015,
      position: new THREE.Vector3(0, 0.9 + index * 0.08, frame.z),
      color: index === 2 ? "#b4c8ff" : "#6f84df",
      emissive: index === 2 ? "#8da4ff" : "#5b6fce",
      opacity: frame.opacity,
    });

    portal.add(mesh);
  });

  const crossBeamMaterial = new THREE.MeshBasicMaterial({
    color: "#dbe4ff",
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  portal.add(
    createThinBox({
      size: new THREE.Vector3(2.8, 0.06, 0.08),
      position: new THREE.Vector3(-0.5, 2.36, -3.72),
      rotation: new THREE.Euler(0.08, 0.16, 0.24),
      material: crossBeamMaterial,
    }),
    createThinBox({
      size: new THREE.Vector3(3.2, 0.06, 0.08),
      position: new THREE.Vector3(0.72, -0.42, -4.18),
      rotation: new THREE.Euler(-0.04, -0.22, -0.14),
      material: crossBeamMaterial,
    }),
  );

  world.add(portal);
  addMotionTarget(motionTargets, portal, {
    pointerX: -0.18,
    pointerY: 0.08,
    swayX: 0.08,
    swayY: 0.05,
    rotY: 0.08,
    rotX: 0.03,
    speed: 0.72,
  });

  const bustGroup = new THREE.Group();
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(3.28, 4.12, 0.2),
    createSurfaceMaterial({
      color: "#0b1021",
      emissive: "#0e1830",
      emissiveIntensity: 0.32,
      roughness: 0.24,
      metalness: 0.28,
      clearcoat: 0.78,
      clearcoatRoughness: 0.08,
      opacity: 0.94,
    }),
  );
  slab.position.set(0, 0.92, -0.2);
  bustGroup.add(slab);

  const imageMaterial = new THREE.MeshPhysicalMaterial({
    color: "#eff3ff",
    emissive: "#0e1730",
    emissiveIntensity: 0.18,
    metalness: 0.08,
    roughness: 0.4,
    clearcoat: 0.26,
    clearcoatRoughness: 0.14,
  });
  const imagePlane = new THREE.Mesh(new THREE.PlaneGeometry(3.04, 4.1), imageMaterial);
  imagePlane.position.set(0, 1.0, -0.08);
  bustGroup.add(imagePlane);

  const imageFrame = createFrame({
    width: 3.14,
    height: 4.18,
    depth: 0.12,
    thickness: 0.09,
    position: new THREE.Vector3(0, 1, 0.06),
    color: "#d7e3ff",
    emissive: "#8da6ff",
    opacity: 0.62,
  });
  bustGroup.add(imageFrame);

  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.3, 1.12),
    createSurfaceMaterial({
      color: "#14192d",
      emissive: "#0a1124",
      roughness: 0.7,
      metalness: 0.22,
      clearcoat: 0.18,
    }),
  );
  cap.position.set(0, -1.18, 0.18);
  bustGroup.add(cap);

  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(1.96, 0.72, 1.52),
    createSurfaceMaterial({
      color: "#0d111f",
      emissive: "#0b1226",
      emissiveIntensity: 0.12,
      roughness: 0.82,
      metalness: 0.14,
      clearcoat: 0.12,
    }),
  );
  pedestal.position.set(0, -1.62, 0.08);
  bustGroup.add(pedestal);

  const underGlow = new THREE.Mesh(
    new THREE.CircleGeometry(1.18, 40),
    new THREE.MeshBasicMaterial({
      color: "#90a2ff",
      transparent: true,
      opacity: 0.26,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  underGlow.rotation.x = -Math.PI * 0.5;
  underGlow.position.set(0, -1.98, 0.22);
  bustGroup.add(underGlow);

  bustGroup.position.set(0, 0.26, -0.48);
  world.add(bustGroup);
  addMotionTarget(motionTargets, bustGroup, {
    pointerX: -0.34,
    pointerY: 0.2,
    swayY: 0.08,
    swayZ: 0.04,
    rotY: 0.12,
    rotX: 0.05,
    speed: 0.9,
    phase: 0.42,
  });

  const sideStructures = new THREE.Group();
  [
    {
      size: new THREE.Vector3(0.34, 3.96, 0.24),
      position: new THREE.Vector3(-2.82, 0.26, -2.2),
      rotation: new THREE.Euler(0.06, 0.5, 0.22),
      opacity: 0.42,
    },
    {
      size: new THREE.Vector3(0.34, 3.24, 0.24),
      position: new THREE.Vector3(2.76, 0.54, -2.66),
      rotation: new THREE.Euler(-0.04, -0.56, -0.16),
      opacity: 0.3,
    },
  ].forEach((panel, index) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(panel.size.x, panel.size.y, panel.size.z),
      createSurfaceMaterial({
        color: index === 0 ? "#101835" : "#1a153a",
        emissive: index === 0 ? "#1d2b54" : "#26185d",
        emissiveIntensity: 0.28,
        opacity: panel.opacity,
        roughness: 0.24,
        metalness: 0.2,
        clearcoat: 0.68,
        clearcoatRoughness: 0.14,
      }),
    );

    mesh.position.copy(panel.position);
    mesh.rotation.set(panel.rotation.x, panel.rotation.y, panel.rotation.z);

    sideStructures.add(mesh);
    addMotionTarget(motionTargets, mesh, {
      pointerX: index === 0 ? 0.14 : -0.14,
      swayX: 0.05,
      swayY: 0.04,
      rotY: index === 0 ? -0.06 : 0.05,
      rotX: 0.02,
      speed: 0.66 + index * 0.18,
      phase: index * 0.7,
    });
  });
  world.add(sideStructures);

  const prismMaterial = new THREE.MeshStandardMaterial({
    color: "#dce5ff",
    emissive: "#9cb2ff",
    emissiveIntensity: 0.52,
    metalness: 0.62,
    roughness: 0.2,
    transparent: true,
    opacity: 0.86,
  });

  const prisms = new THREE.Group();
  [
    { scale: [0.36, 0.7, 0.36], position: [-1.92, 2.42, -1.72], rotation: [0.72, 0.28, 0.18] },
    { scale: [0.28, 0.56, 0.28], position: [2.02, 2.12, -1.88], rotation: [-0.44, 0.72, -0.24] },
    { scale: [0.22, 0.42, 0.22], position: [-2.58, -1.14, -1.06], rotation: [0.2, -0.58, 0.34] },
    { scale: [0.2, 0.44, 0.2], position: [2.68, -1.04, -1.22], rotation: [-0.26, 0.48, 0.16] },
  ].forEach((config, index) => {
    const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), prismMaterial);

    mesh.scale.set(config.scale[0], config.scale[1], config.scale[2]);
    mesh.position.set(config.position[0], config.position[1], config.position[2]);
    mesh.rotation.set(config.rotation[0], config.rotation[1], config.rotation[2]);

    prisms.add(mesh);
    addMotionTarget(motionTargets, mesh, {
      pointerX: index % 2 === 0 ? -0.1 : 0.1,
      pointerY: 0.06,
      swayX: 0.06,
      swayY: 0.06,
      swayZ: 0.04,
      rotY: 0.12,
      rotX: 0.08,
      rotZ: 0.08,
      speed: 0.94 + index * 0.16,
      phase: 0.6 + index * 0.42,
    });
  });
  world.add(prisms);

  const ribbons = new THREE.Group();
  [
    { size: new THREE.Vector3(2.1, 0.05, 0.08), position: new THREE.Vector3(-1.88, 2.82, -2.9), rotation: new THREE.Euler(0.12, 0.18, 0.46), opacity: 0.2 },
    { size: new THREE.Vector3(2.6, 0.05, 0.08), position: new THREE.Vector3(1.92, -0.48, -2.7), rotation: new THREE.Euler(-0.08, -0.18, -0.22), opacity: 0.16 },
    { size: new THREE.Vector3(1.64, 0.05, 0.08), position: new THREE.Vector3(0.34, 3.18, -3.64), rotation: new THREE.Euler(0.04, -0.14, 0.2), opacity: 0.14 },
  ].forEach((bar) => {
    ribbons.add(
      createThinBox({
        size: bar.size,
        position: bar.position,
        rotation: bar.rotation,
        material: new THREE.MeshBasicMaterial({
          color: "#d7e1ff",
          transparent: true,
          opacity: bar.opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      }),
    );
  });
  world.add(ribbons);

  const stars = createStarfield();
  world.add(stars);
  addMotionTarget(motionTargets, stars, {
    pointerX: -0.08,
    pointerY: 0.04,
    swayX: 0.03,
    swayY: 0.02,
    rotY: 0.02,
    rotX: 0.02,
    speed: 0.32,
  });

  world.position.set(0, -0.14, 0);

  return {
    world,
    motionTargets,
    imageMaterial,
  };
}
