import * as THREE from "/public/vendor/three/three.module.js";
import { clamp, disposeObject3D } from "./three-utils.js";

const DEFAULT_MODEL_URL = "/public/models/warum-wir/geschweifte-klammer-3d.glb";
const CAMERA_HALF_HEIGHT = 5.4;
const MAX_PIXEL_RATIO = 1.5;
const raycaster = new THREE.Raycaster();
const projectedPoint = new THREE.Vector3();

function damp(current, target, factor, delta) {
  return current + (target - current) * (1 - Math.pow(1 - factor, delta));
}

function tuneModelMaterials(object) {
  object.traverse((child) => {
    if (!child.isMesh || !child.material) {
      return;
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];

    materials.forEach((material) => {
      material.side = THREE.DoubleSide;

      if (material.color?.isColor) {
        material.color.lerp(new THREE.Color("#eef2ff"), 0.28);
      }

      if (material.emissive?.isColor) {
        material.emissive.lerp(new THREE.Color("#7f8fff"), 0.86);
        material.emissiveIntensity = Math.max(material.emissiveIntensity ?? 0, 0.22);
      }

      if (typeof material.roughness === "number") {
        material.roughness = Math.min(material.roughness, 0.48);
      }

      if (typeof material.metalness === "number") {
        material.metalness = Math.max(material.metalness, 0.28);
      }

      if (typeof material.envMapIntensity === "number") {
        material.envMapIntensity = Math.max(material.envMapIntensity, 1.25);
      }

      material.needsUpdate = true;
    });
  });
}

async function loadBracePrototype(assetUrl) {
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");

  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    loader.load(
      assetUrl,
      (gltf) => {
        const source = gltf.scene ?? gltf.scenes?.[0];

        if (!source) {
          reject(new Error("Brace asset does not contain a scene."));
          return;
        }

        tuneModelMaterials(source);
        source.updateMatrixWorld(true);

        const bounds = new THREE.Box3().setFromObject(source);

        if (bounds.isEmpty()) {
          reject(new Error("Brace asset bounds are empty."));
          return;
        }

        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
        const scale = 1 / maxDimension;

        source.position.sub(center);
        source.scale.setScalar(scale);
        source.updateMatrixWorld(true);

        resolve({
          template: source,
          size: size.multiplyScalar(scale),
        });
      },
      undefined,
      reject,
    );
  });
}

function createBraceRig({ id, mirrored, phase, template, size }) {
  const anchor = new THREE.Group();
  const modelPivot = new THREE.Group();
  const model = template.clone(true);
  const collider = new THREE.Mesh(
    new THREE.BoxGeometry(
      Math.max(size.x * 1.15, 0.4),
      Math.max(size.y * 1.08, 1.4),
      Math.max(size.z * 2.4, 0.55),
    ),
    new THREE.MeshBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );

  collider.userData.braceId = id;

  if (mirrored) {
    modelPivot.rotation.y = Math.PI;
  }

  modelPivot.add(model);
  modelPivot.add(collider);
  anchor.add(modelPivot);

  return {
    id,
    phase,
    anchor,
    collider,
    basePosition: new THREE.Vector3(),
    baseRotation: new THREE.Euler(),
    baseScale: 1,
    hoverOffset: new THREE.Vector3(),
    hoverRotation: new THREE.Vector3(),
    impulseOffset: new THREE.Vector3(),
    impulseVelocity: new THREE.Vector3(),
    impulseRotation: new THREE.Vector3(),
    impulseAngularVelocity: new THREE.Vector3(),
    radiusPx: 120,
    lastHitAt: -Infinity,
    inProximity: false,
  };
}

function applyKick(brace, pointer, time, { strength = 1.0 } = {}) {
  if (time - brace.lastHitAt < 220) {
    return;
  }

  // Only kick when cursor moves fast enough — prevents jitter from micro-movements
  const moveSpeed = Math.hypot(pointer.vx, pointer.vy);
  if (moveSpeed < 3.5) {
    return;
  }

  brace.lastHitAt = time;

  const side = brace.id === "left" ? -1 : 1;
  const speed = clamp(moveSpeed / 30, 0.3, 1.4) * strength;
  const swingX = clamp(pointer.vx / 36, -1.2, 1.2);
  const swingY = clamp(pointer.vy / 36, -1.0, 1.0);

  brace.impulseVelocity.x += (side * 0.16 + swingX * 0.08) * speed;
  brace.impulseVelocity.y += (-swingY * 0.06) * speed;
  brace.impulseVelocity.z += 0.10 * speed;

  brace.impulseAngularVelocity.x += swingY * 0.13 * speed;
  brace.impulseAngularVelocity.y += (side * 0.22 + swingX * 0.12) * speed;
  brace.impulseAngularVelocity.z += (side * 0.10 + swingX * 0.06) * speed;
}

export function initWarumWirTechBraces({ reduceMotion = false } = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const root = document.querySelector("[data-tech-braces-root]");
  const canvasHost = root?.querySelector("[data-tech-braces-canvas]");

  if (!root || !canvasHost) {
    return;
  }

  root.dataset.techBracesState = "loading";

  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    root.dataset.techBracesState = "unavailable";
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.domElement.className = "tech-braces-stage__canvas";
  canvasHost.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 40);
  const braceGroup = new THREE.Group();
  const ambience = new THREE.HemisphereLight("#f7f9ff", "#1a2040", 1.24);
  const fill = new THREE.DirectionalLight("#f4e8ff", 1.85);
  const rim = new THREE.DirectionalLight("#7f8fff", 2.15);
  const leftGlow = new THREE.PointLight("#96a6ff", 18, 14, 2);
  const rightGlow = new THREE.PointLight("#d6b8ff", 18, 14, 2);
  let animationFrameId = 0;
  let resizeObserver = null;
  let intersectionObserver = null;
  let isVisible = true;
  let disposed = false;
  let lastFrameTime = performance.now();
  let rootBounds = root.getBoundingClientRect();
  let braces = [];
  let template = null;
  const pointer = {
    x: rootBounds.width * 0.5,
    y: rootBounds.height * 0.5,
    lastX: rootBounds.width * 0.5,
    lastY: rootBounds.height * 0.5,
    vx: 0,
    vy: 0,
    ndcX: 0,
    ndcY: 0,
    inside: false,
  };

  fill.position.set(2.4, 3.2, 5.4);
  rim.position.set(-3.8, 2.8, 3.2);

  scene.add(ambience, fill, rim, leftGlow, rightGlow, braceGroup);
  camera.position.set(0, 0, 12);

  const updateLayout = () => {
    rootBounds = root.getBoundingClientRect();

    const width = Math.max(1, Math.floor(rootBounds.width));
    const height = Math.max(1, Math.floor(rootBounds.height));
    const aspect = width / height;
    const compact = width < 760;
    const narrow = width < 560;
    const braceScale = narrow ? 3.7 : compact ? 4.25 : 4.95;
    const horizontalOffset = Math.max(aspect * 3.72, 4.18);
    const left = braces[0];
    const right = braces[1];

    renderer.setSize(width, height, false);
    camera.left = -aspect * CAMERA_HALF_HEIGHT;
    camera.right = aspect * CAMERA_HALF_HEIGHT;
    camera.top = CAMERA_HALF_HEIGHT;
    camera.bottom = -CAMERA_HALF_HEIGHT;
    camera.updateProjectionMatrix();

    if (!left || !right) {
      return;
    }

    left.baseScale = braceScale;
    left.basePosition.set(-horizontalOffset, 0.26, 0.14);
    left.baseRotation.set(0.16, 0.58, 0.24);
    left.radiusPx = clamp(width * 0.12, 74, 132);

    right.baseScale = braceScale;
    right.basePosition.set(horizontalOffset, -0.2, 0.12);
    right.baseRotation.set(-0.12, -0.58, -0.24);
    right.radiusPx = clamp(width * 0.12, 74, 132);
  };
  const handleResize = () => {
    updateLayout();
    renderFrame(performance.now());
  };

  const updateHoverState = () => {
    if (!pointer.inside) {
      delete root.dataset.techBracesHover;
      return;
    }

    raycaster.setFromCamera(
      {
        x: pointer.ndcX,
        y: pointer.ndcY,
      },
      camera,
    );

    const hit = raycaster.intersectObjects(braces.map((brace) => brace.collider), false)[0];
    const braceId = hit?.object?.userData?.braceId ?? "";

    if (braceId) {
      root.dataset.techBracesHover = braceId;
      return;
    }

    delete root.dataset.techBracesHover;
  };

  const handlePointerMove = (event) => {
    if (disposed) {
      return;
    }

    const nextX = clamp(event.clientX - rootBounds.left, 0, rootBounds.width);
    const nextY = clamp(event.clientY - rootBounds.top, 0, rootBounds.height);

    pointer.vx = nextX - pointer.lastX;
    pointer.vy = nextY - pointer.lastY;
    pointer.lastX = nextX;
    pointer.lastY = nextY;
    pointer.x = nextX;
    pointer.y = nextY;
    pointer.ndcX = (nextX / Math.max(rootBounds.width, 1)) * 2 - 1;
    pointer.ndcY = -((nextY / Math.max(rootBounds.height, 1)) * 2 - 1);
    pointer.inside = true;

    updateHoverState();

    if (reduceMotion) {
      renderFrame(performance.now());
      return;
    }

    // No kicks while hovering — the smooth hoverOffset handles active cursor interaction.
    // Only apply a kick on a fast swipe (cursor moves through quickly without dwelling).
  };

  const handlePointerLeave = () => {
    pointer.inside = false;
    pointer.vx = 0;
    pointer.vy = 0;
    pointer.lastX = rootBounds.width * 0.5;
    pointer.lastY = rootBounds.height * 0.5;
    delete root.dataset.techBracesHover;
  };

  const renderFrame = (time) => {
    if (disposed) {
      return;
    }

    const delta = clamp((time - lastFrameTime) / 16.6667, 0.65, 2.1);
    lastFrameTime = time;

    if (!isVisible && !reduceMotion) {
      return;
    }

    braces.forEach((brace) => {
      // Use base position (not animated position) to avoid feedback-loop jitter:
      // if we used the live anchor position, moving the brace away from the cursor
      // would change dx/dy → new repel target → brace moves again → oscillation.
      projectedPoint.copy(brace.basePosition);
      projectedPoint.project(camera);

      const screenX = (projectedPoint.x * 0.5 + 0.5) * rootBounds.width;
      const screenY = (-projectedPoint.y * 0.5 + 0.5) * rootBounds.height;
      const dx = pointer.x - screenX;
      const dy = pointer.y - screenY;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const rawInfluence = pointer.inside && !reduceMotion
        ? clamp(1 - distance / brace.radiusPx, 0, 1)
        : 0;
      // smoothstep for sharper "touch" feel at close range
      const influence = rawInfluence * rawInfluence * (3 - 2 * rawInfluence);

      // Track proximity — only used to keep inProximity state current.
      brace.inProximity = rawInfluence > 0;

      // Hover: only a gentle tilt toward the cursor — no position repel.
      // Position-based repel reacts to every micro-movement and looks jittery.
      // Rotation is smoother because it pivots around center without displacing it.
      const normX = distance > 1 ? dx / distance : 0;
      const normY = distance > 1 ? dy / distance : 0;
      const tiltX =  normY * influence * 0.22;
      const tiltY = -normX * influence * 0.28;
      const hoverZ = influence * 0.30;

      const idleX = reduceMotion ? 0 : Math.sin(time * 0.00052 + brace.phase) * 0.06;
      const idleY = reduceMotion ? 0 : Math.cos(time * 0.0009 + brace.phase) * 0.18;
      const idleZ = reduceMotion ? 0 : Math.sin(time * 0.00068 + brace.phase) * 0.08;
      const idleRotX = reduceMotion ? 0 : Math.cos(time * 0.00046 + brace.phase) * 0.04;
      const idleRotY = reduceMotion ? 0 : Math.sin(time * 0.00048 + brace.phase) * 0.06;
      const idleRotZ = reduceMotion ? 0 : Math.cos(time * 0.00052 + brace.phase) * 0.05;

      // Position: only Z push toward camera, no X/Y displacement
      brace.hoverOffset.x = damp(brace.hoverOffset.x, 0,      0.06, delta);
      brace.hoverOffset.y = damp(brace.hoverOffset.y, 0,      0.06, delta);
      brace.hoverOffset.z = damp(brace.hoverOffset.z, hoverZ, 0.08, delta);

      // Rotation: tilt follows cursor direction, slow enough to glide smoothly
      brace.hoverRotation.x = damp(brace.hoverRotation.x, tiltX, 0.06, delta);
      brace.hoverRotation.y = damp(brace.hoverRotation.y, tiltY, 0.06, delta);
      brace.hoverRotation.z = damp(brace.hoverRotation.z, 0,     0.06, delta);

      // Spring-damper physics — slightly underdamped for a natural settle
      // F = -k*x - d*v
      const SK = 0.07;   // spring stiffness
      const SD = 0.42;   // high damping — settles fast, no oscillation
      const RK = 0.08;
      const RD = 0.44;

      const axes = ["x", "y", "z"];
      for (const ax of axes) {
        const tAcc = -SK * brace.impulseOffset[ax] - SD * brace.impulseVelocity[ax];
        brace.impulseVelocity[ax] += tAcc * delta;
        brace.impulseOffset[ax]   += brace.impulseVelocity[ax] * delta;

        const rAcc = -RK * brace.impulseRotation[ax] - RD * brace.impulseAngularVelocity[ax];
        brace.impulseAngularVelocity[ax] += rAcc * delta;
        brace.impulseRotation[ax]        += brace.impulseAngularVelocity[ax] * delta;
      }

      brace.impulseOffset.x = clamp(brace.impulseOffset.x, -0.88, 0.88);
      brace.impulseOffset.y = clamp(brace.impulseOffset.y, -0.56, 0.56);
      brace.impulseOffset.z = clamp(brace.impulseOffset.z, -0.50, 0.50);
      brace.impulseRotation.x = clamp(brace.impulseRotation.x, -0.58, 0.58);
      brace.impulseRotation.y = clamp(brace.impulseRotation.y, -0.92, 0.92);
      brace.impulseRotation.z = clamp(brace.impulseRotation.z, -0.46, 0.46);

      brace.anchor.position.set(
        brace.basePosition.x + idleX + brace.hoverOffset.x + brace.impulseOffset.x,
        brace.basePosition.y + idleY + brace.hoverOffset.y + brace.impulseOffset.y,
        brace.basePosition.z + idleZ + brace.hoverOffset.z + brace.impulseOffset.z,
      );

      brace.anchor.rotation.set(
        brace.baseRotation.x + idleRotX + brace.hoverRotation.x + brace.impulseRotation.x,
        brace.baseRotation.y + idleRotY + brace.hoverRotation.y + brace.impulseRotation.y,
        brace.baseRotation.z + idleRotZ + brace.hoverRotation.z + brace.impulseRotation.z,
      );

      brace.anchor.scale.setScalar(brace.baseScale);
    });

    const left = braces[0];
    const right = braces[1];

    if (left && right) {
      leftGlow.position.copy(left.anchor.position).add(new THREE.Vector3(0.7, 0.45, 1.9));
      rightGlow.position.copy(right.anchor.position).add(new THREE.Vector3(-0.8, 0.42, 1.9));
    }

    renderer.render(scene, camera);
  };

  const animate = (time) => {
    animationFrameId = window.requestAnimationFrame(animate);
    renderFrame(time);
  };

  const disposeScene = () => {
    if (disposed) {
      return;
    }

    disposed = true;
    cancelAnimationFrame(animationFrameId);
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("pagehide", disposeScene);
    window.removeEventListener("blur", handlePointerLeave);
    root.removeEventListener("pointermove", handlePointerMove);
    root.removeEventListener("pointerleave", handlePointerLeave);
    root.removeEventListener("pointercancel", handlePointerLeave);
    braces.forEach((brace) => {
      brace.collider.geometry.dispose();
      brace.collider.material.dispose();
    });
    braceGroup.clear();
    disposeObject3D(template);
    renderer.dispose();
    renderer.domElement.remove();
  };

  loadBracePrototype(root.dataset.techBracesModelUrl || DEFAULT_MODEL_URL)
    .then(({ template: nextTemplate, size }) => {
      if (disposed) {
        disposeObject3D(nextTemplate);
        return;
      }

      template = nextTemplate;
      braces = [
        createBraceRig({ id: "left", mirrored: false, phase: 0.25, template, size }),
        createBraceRig({ id: "right", mirrored: true, phase: 1.7, template, size }),
      ];
      braces.forEach((brace) => braceGroup.add(brace.anchor));

      updateLayout();
      root.dataset.techBracesState = "ready";

      renderFrame(performance.now());

      if (!reduceMotion) {
        animate(performance.now());
      }
    })
    .catch((error) => {
      console.warn("[warum-wir-tech-braces] Brace asset konnte nicht geladen werden.", error);
      root.dataset.techBracesState = "unavailable";
      disposeScene();
    });

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => {
      updateLayout();
      renderFrame(performance.now());
    });

    resizeObserver.observe(root);
  } else {
    window.addEventListener("resize", handleResize);
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
  window.addEventListener("blur", handlePointerLeave);
  window.addEventListener("pagehide", disposeScene);
  updateLayout();
}
