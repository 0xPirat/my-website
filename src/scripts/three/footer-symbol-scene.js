import * as THREE from "/public/vendor/three/three.module.js";

const LOGO_TEXTURE_URL = "/public/media/branding/buildit-logo-metallic-alpha.png";
const LOGO_ASPECT_RATIO = 600 / 542;
const LOGO_LAYER_SIZE = Object.freeze({
  width: 1.56,
  height: 1.56 * LOGO_ASPECT_RATIO,
});

function disposeMaterial(material, disposedTextures) {
  if (!material) {
    return;
  }

  if (Array.isArray(material)) {
    material.forEach((entry) => disposeMaterial(entry, disposedTextures));
    return;
  }

  Object.values(material).forEach((value) => {
    if (value && value.isTexture && !disposedTextures.has(value.uuid)) {
      disposedTextures.add(value.uuid);
      value.dispose();
    }
  });

  material.dispose();
}

function disposeObject3D(object) {
  const disposedTextures = new Set();

  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (child.material) {
      disposeMaterial(child.material, disposedTextures);
    }
  });
}

function createStageShadow() {
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.34, 48),
    new THREE.MeshBasicMaterial({
      color: "#050818",
      transparent: true,
      opacity: 0.22,
    }),
  );

  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(-0.1, -1.02, -0.72);
  shadow.scale.set(0.98, 0.52, 1);

  return shadow;
}

function configureLogoTexture(texture, renderer) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
}

function createLogoTexture(renderer) {
  const textureLoader = new THREE.TextureLoader();
  const logoTexture = textureLoader.load(LOGO_TEXTURE_URL);

  configureLogoTexture(logoTexture, renderer);
  logoTexture.needsUpdate = true;

  return logoTexture;
}

function createLogoModel(renderer) {
  const logoTexture = createLogoTexture(renderer);
  const layerGeometry = new THREE.PlaneGeometry(
    LOGO_LAYER_SIZE.width,
    LOGO_LAYER_SIZE.height,
  );
  const frontMaterial = new THREE.MeshBasicMaterial({
    map: logoTexture,
    transparent: true,
    alphaTest: 0.08,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const midMaterial = new THREE.MeshBasicMaterial({
    map: logoTexture,
    transparent: true,
    alphaTest: 0.08,
    color: "#9ba5b8",
    opacity: 0.24,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const backMaterial = new THREE.MeshBasicMaterial({
    map: logoTexture,
    transparent: true,
    alphaTest: 0.08,
    color: "#222b3d",
    opacity: 0.58,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const rimMaterial = new THREE.MeshBasicMaterial({
    map: logoTexture,
    transparent: true,
    alphaTest: 0.08,
    color: "#0e1421",
    opacity: 0.8,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const glowMaterial = new THREE.MeshBasicMaterial({
    map: logoTexture,
    color: "#eef4ff",
    transparent: true,
    alphaTest: 0.08,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const rimPlate = new THREE.Mesh(layerGeometry, rimMaterial);
  const backPlate = new THREE.Mesh(layerGeometry.clone(), backMaterial);
  const midPlate = new THREE.Mesh(layerGeometry.clone(), midMaterial);
  const frontPlate = new THREE.Mesh(layerGeometry.clone(), frontMaterial);
  const glowPlate = new THREE.Mesh(layerGeometry.clone(), glowMaterial);
  const group = new THREE.Group();

  rimPlate.position.set(-0.17, -0.14, -0.22);
  backPlate.position.set(-0.11, -0.09, -0.12);
  midPlate.position.set(-0.055, -0.045, -0.045);
  frontPlate.position.set(0, 0, 0.02);
  glowPlate.position.set(0.008, 0.01, 0.05);
  glowPlate.scale.setScalar(1.018);

  group.add(rimPlate);
  group.add(backPlate);
  group.add(midPlate);
  group.add(frontPlate);
  group.add(glowPlate);

  group.rotation.x = -0.03;
  group.rotation.y = 0.06;
  group.position.set(0.04, -0.02, -0.04);
  group.scale.setScalar(1.34);

  return group;
}

export function initFooterSymbolScene({ reduceMotion = false } = {}) {
  const mountNode = document.querySelector("[data-footer-symbol-stage], #footer-symbol-stage");

  if (!mountNode || typeof window === "undefined") {
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(29, 1, 0.1, 100);
  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    mountNode.dataset.sceneState = "unavailable";
    mountNode.setAttribute("aria-hidden", "true");
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  mountNode.append(renderer.domElement);

  camera.position.set(0.02, 0.02, 4.36);

  const stageShadow = createStageShadow();
  const logoModel = createLogoModel(renderer);

  scene.add(stageShadow);
  scene.add(logoModel);

  let animationFrameId = 0;
  let targetRotationY = logoModel.rotation.y;
  let currentRotationY = logoModel.rotation.y;
  let pointerActive = false;
  let lastPointerX = 0;

  const clampRotation = (value) => Math.max(-0.1, Math.min(0.16, value));

  const resizeRenderer = () => {
    const { clientWidth, clientHeight } = mountNode;

    if (!clientWidth || !clientHeight) {
      return;
    }

    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  };

  const onPointerDown = (event) => {
    pointerActive = true;
    lastPointerX = event.clientX;
    mountNode.classList.add("is-dragging");
    mountNode.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!pointerActive) {
      return;
    }

    const deltaX = event.clientX - lastPointerX;

    lastPointerX = event.clientX;
    targetRotationY = clampRotation(targetRotationY + deltaX * 0.0035);
  };

  const onPointerUp = (event) => {
    pointerActive = false;
    mountNode.classList.remove("is-dragging");

    if (mountNode.hasPointerCapture(event.pointerId)) {
      mountNode.releasePointerCapture(event.pointerId);
    }
  };

  const animate = (time) => {
    animationFrameId = window.requestAnimationFrame(animate);

    if (!pointerActive && !reduceMotion) {
      targetRotationY = 0.06 + Math.sin(time * 0.00062) * 0.018;
    }

    currentRotationY += (targetRotationY - currentRotationY) * 0.08;
    logoModel.rotation.y = currentRotationY;

    if (!reduceMotion) {
      logoModel.rotation.x = -0.03 + Math.cos(time * 0.0009) * 0.003;
      logoModel.position.y = -0.02 + Math.sin(time * 0.00112) * 0.012;
      stageShadow.material.opacity = 0.19 + Math.cos(time * 0.00112) * 0.01;
    }

    renderer.render(scene, camera);
  };

  const resizeObserver = new ResizeObserver(resizeRenderer);

  resizeRenderer();
  resizeObserver.observe(mountNode);
  mountNode.addEventListener("pointerdown", onPointerDown);
  mountNode.addEventListener("pointermove", onPointerMove);
  mountNode.addEventListener("pointerup", onPointerUp);
  mountNode.addEventListener("pointerleave", onPointerUp);
  mountNode.addEventListener("pointercancel", onPointerUp);

  animationFrameId = window.requestAnimationFrame(animate);

  return () => {
    window.cancelAnimationFrame(animationFrameId);
    resizeObserver.disconnect();
    mountNode.removeEventListener("pointerdown", onPointerDown);
    mountNode.removeEventListener("pointermove", onPointerMove);
    mountNode.removeEventListener("pointerup", onPointerUp);
    mountNode.removeEventListener("pointerleave", onPointerUp);
    mountNode.removeEventListener("pointercancel", onPointerUp);
    disposeObject3D(logoModel);
    disposeObject3D(stageShadow);
    renderer.dispose();

    if (typeof renderer.forceContextLoss === "function") {
      renderer.forceContextLoss();
    }

    mountNode.textContent = "";
  };
}
