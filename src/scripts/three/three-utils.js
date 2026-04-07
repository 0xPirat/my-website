/**
 * three-utils.js
 * Gemeinsame Three.js-Hilfsfunktionen für alle Scene-Files.
 * Eliminiert die duplizierten clamp/dispose-Implementierungen
 * aus footer-symbol-scene, night-sky-world, schablonen-room-scene
 * und warum-wir-tech-braces.
 */

// ── Math ──────────────────────────────────────────────────────────────────────

/** Klemmt value auf [min, max]. */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// ── Ressourcen-Disposal ───────────────────────────────────────────────────────

/**
 * Gibt ein einzelnes Material frei, inklusive aller zugehörigen Texturen.
 * Verhindert doppeltes Dispose via disposedTextures-Set.
 *
 * @param {THREE.Material|THREE.Material[]|null} material
 * @param {Set<string>} [disposedTextures]
 */
export function disposeMaterial(material, disposedTextures = new Set()) {
  if (!material) return;

  if (Array.isArray(material)) {
    material.forEach((m) => disposeMaterial(m, disposedTextures));
    return;
  }

  // Alle Texture-Werte eines Materials iterieren.
  Object.values(material).forEach((value) => {
    if (value?.isTexture && !disposedTextures.has(value.uuid)) {
      disposedTextures.add(value.uuid);
      value.dispose();
    }
  });

  material.dispose();
}

/**
 * Traversiert einen Object3D-Graph und gibt alle Geometrien und Materialien frei.
 * Null-safe: wird ignoriert wenn object null/undefined ist.
 *
 * @param {THREE.Object3D|null} object
 */
export function disposeObject3D(object) {
  if (!object) return;

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
