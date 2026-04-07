/**
 * landing-scene-switcher.js
 * Orchestriert den interaktiven Landing-Scene-Wechsel.
 *
 * Modul-Übersicht:
 *   animation-config.js  — alle Bewegungs-Konstanten und Feature-Flags
 *   scene-utils.js       — pure Hilfsfunktionen (kein State, kein GSAP)
 *   scene-state.js       — GSAP-DOM-State-Schreiber
 *   drift-controller.js  — Pointer-Parallax-Loop-Factory
 */

import { gsap } from "../../../public/vendor/gsap/index.js";
import { buildSceneHash, parseSceneHash } from "../config/scene-pages.js";
import { FEATURE_FLAGS } from "./animation-config.js";
import {
  wrapIndex,
  getDirection,
  getSceneMotion,
  getPanelBaseOffset,
  buildPanelState,
  getBurstConfig,
  getBackgroundLayers,
  getProgressLayers,
} from "./scene-utils.js";
import {
  setControlState,
  setSceneState,
  setLayer,
  animateLayer,
  resetBackgroundLayers,
  resetProgressLayers,
} from "./scene-state.js";
import { createDriftController } from "./drift-controller.js";

// ── Initialisierung ───────────────────────────────────────────────────────────

export function initLandingSceneSwitcher({ reduceMotion = false } = {}) {
  const root = document.querySelector("[data-scene-root]");

  if (!root) return;

  // ── DOM-Referenzen ────────────────────────────────────────────────────────

  const stage = root.querySelector("[data-scene-stage]");
  const driftLayer = root.querySelector("[data-scene-drift]");
  const assembly = root.querySelector("[data-scene-assembly]");
  const shell = root.querySelector("[data-scene-shell]");
  const backgroundStage = root.querySelector(".landing-backgrounds");
  const panels = Array.from(root.querySelectorAll("[data-scene-panel]"));
  const backgrounds = Array.from(root.querySelectorAll("[data-scene-bg]"));
  const progressScenes = Array.from(root.querySelectorAll("[data-scene-progress]"));
  const pieces = Array.from(root.querySelectorAll("[data-piece]"));
  const arrows = Array.from(root.querySelectorAll("[data-scene-step]"));
  const controls = Array.from(document.querySelectorAll("[data-scene-target]"));
  const tabs = controls.filter((control) => control.getAttribute("role") === "tab");
  const sceneKeys = panels.map((panel) => panel.dataset.scenePanel).filter(Boolean);

  if (
    !stage ||
    !shell ||
    !backgroundStage ||
    !sceneKeys.length ||
    sceneKeys.length !== backgrounds.length ||
    sceneKeys.length !== progressScenes.length
  ) {
    return;
  }

  // ── State-Setup ───────────────────────────────────────────────────────────

  let activeKey = parseSceneHash(window.location.hash) || root.dataset.scene || sceneKeys[0];

  if (!sceneKeys.includes(activeKey)) {
    activeKey = sceneKeys[0];
  }

  let activeIndex = sceneKeys.indexOf(activeKey);
  let isTransitioning = false;

  // Lookup-Maps für schnellen Zugriff via Scene-Key.
  const panelMap = new Map(panels.map((p) => [p.dataset.scenePanel, p]));
  const backgroundMap = new Map(backgrounds.map((b) => [b.dataset.sceneBg, b]));
  const backgroundLayers = new Map(
    backgrounds.map((b) => [b.dataset.sceneBg, getBackgroundLayers(b)]),
  );
  const progressMap = new Map(
    progressScenes.map((ps) => [ps.dataset.sceneProgress, ps]),
  );
  const progressLayers = new Map(
    progressScenes.map((ps) => [ps.dataset.sceneProgress, getProgressLayers(ps)]),
  );

  // ── Helpers ───────────────────────────────────────────────────────────────

  const updateHash = (key) => {
    const nextHash = buildSceneHash(key);

    if (window.location.hash === nextHash) return;

    if (history.replaceState) {
      history.replaceState(null, "", nextHash);
      return;
    }

    window.location.hash = nextHash;
  };

  /** Setzt den visuellen Endzustand nach einer abgeschlossenen Transition. */
  const finishScene = (index) => {
    activeIndex = index;
    setSceneState({ root, panels, backgrounds, progressScenes, controls, key: sceneKeys[index] });
    resetBackgroundLayers(backgroundLayers.get(sceneKeys[index]) || {});
    resetProgressLayers(progressLayers.get(sceneKeys[index]) || {});
    updateHash(sceneKeys[index]);
  };

  // ── Transition-Engine ─────────────────────────────────────────────────────

  const transitionTo = (requestedIndex, { initial = false } = {}) => {
    const nextIndex = wrapIndex(requestedIndex, sceneKeys.length);

    if (isTransitioning || (!initial && nextIndex === activeIndex)) return;

    const currentKey = sceneKeys[activeIndex];
    const nextKey = sceneKeys[nextIndex];
    const direction = getDirection(activeIndex, nextIndex, sceneKeys.length);
    const currentMotion = getSceneMotion(currentKey);
    const nextMotion = getSceneMotion(nextKey);
    const currentPanel = panelMap.get(currentKey);
    const nextPanel = panelMap.get(nextKey);
    const currentBackground = backgroundMap.get(currentKey);
    const nextBackground = backgroundMap.get(nextKey);
    const currentProgress = progressMap.get(currentKey);
    const nextProgress = progressMap.get(nextKey);
    const currentLayers = backgroundLayers.get(currentKey);
    const nextLayers = backgroundLayers.get(nextKey);
    const currentProgressState = progressLayers.get(currentKey);
    const nextProgressState = progressLayers.get(nextKey);

    isTransitioning = true;
    root.classList.add("is-transitioning");

    // ── Inaktive Elemente auf Ruheposition setzen ─────────────────────────

    panels.forEach((panel) => {
      const baseOffset = getPanelBaseOffset(panel);
      if (panel !== currentPanel && panel !== nextPanel) {
        gsap.set(panel, buildPanelState(panel, {
          autoAlpha: 0,
          x: baseOffset.x + direction * 52,
          y: baseOffset.y,
          filter: "blur(10px)",
          zIndex: 0,
        }));
      }
    });

    backgrounds.forEach((background) => {
      if (background !== currentBackground && background !== nextBackground) {
        gsap.set(background, {
          autoAlpha: 0,
          xPercent: 0,
          yPercent: 0,
          rotate: 0,
          scale: 1.04,
          filter: "blur(0px) brightness(1) saturate(1)",
          zIndex: 0,
        });
      }
    });

    progressScenes.forEach((progressScene) => {
      if (progressScene !== currentProgress && progressScene !== nextProgress) {
        gsap.set(progressScene, {
          autoAlpha: 0,
          x: 0,
          y: 0,
          scale: 0.98,
          filter: "blur(0px)",
          zIndex: 0,
        });
        resetProgressLayers(progressLayers.get(progressScene.dataset.sceneProgress) || {});
      }
    });

    // ── Initial-Modus: alle Elemente von vorne einblenden ─────────────────

    if (initial) {
      panels.forEach((panel) => {
        const baseOffset = getPanelBaseOffset(panel);
        gsap.set(panel, buildPanelState(panel, {
          autoAlpha: 0,
          x: baseOffset.x + direction * 56,
          y: baseOffset.y,
          filter: "blur(10px)",
          zIndex: 0,
        }));
      });
      gsap.set(backgrounds, {
        autoAlpha: 0,
        xPercent: 0,
        yPercent: 0,
        rotate: 0,
        scale: 1.04,
        filter: "blur(0px) brightness(1) saturate(1)",
        zIndex: 0,
      });
      gsap.set(progressScenes, {
        autoAlpha: 0,
        x: direction * 42,
        y: 18,
        scale: 0.92,
        filter: "blur(16px)",
        zIndex: 0,
      });
      progressScenes.forEach((ps) => {
        resetProgressLayers(progressLayers.get(ps.dataset.sceneProgress) || {});
      });
    }

    // ── Start-Positionen für die Next-Scene setzen ────────────────────────

    const nextPanelBaseOffset = getPanelBaseOffset(nextPanel);
    gsap.set(nextPanel, buildPanelState(nextPanel, {
      autoAlpha: 0,
      x: nextPanelBaseOffset.x + direction * 76,
      y: nextPanelBaseOffset.y,
      filter: "blur(12px)",
      zIndex: 3,
    }));
    gsap.set(nextBackground, {
      autoAlpha: 0,
      xPercent: direction * nextMotion.enterX,
      yPercent: nextMotion.enterY,
      rotate: direction * nextMotion.enterRotate,
      scale: 1.08,
      filter: "blur(18px) brightness(1.08) saturate(1.08)",
      zIndex: 2,
    });
    if (nextProgress) {
      gsap.set(nextProgress, {
        autoAlpha: 0,
        x: direction * 48,
        y: 22,
        scale: 0.9,
        filter: "blur(16px)",
        zIndex: 3,
      });
    }

    resetBackgroundLayers(nextLayers || {});
    resetProgressLayers(nextProgressState || {});

    if (nextLayers) {
      setLayer(nextLayers.wash, {
        xPercent: direction * nextMotion.washX,
        yPercent: nextMotion.washY,
        scale: 1.12,
        opacity: 0.76,
      });
      setLayer(nextLayers.shapeA, {
        xPercent: direction * nextMotion.shapeAX,
        yPercent: nextMotion.shapeAY,
        rotate: direction * nextMotion.shapeARotate,
        scale: 1.08,
      });
      setLayer(nextLayers.shapeB, {
        xPercent: direction * nextMotion.shapeBX,
        yPercent: nextMotion.shapeBY,
        rotate: direction * nextMotion.shapeBRotate,
        scale: 1.1,
      });
      setLayer(nextLayers.grid, {
        xPercent: direction * nextMotion.gridX,
        yPercent: nextMotion.gridY,
        scale: 1.04,
        opacity: 0.18,
      });
    }

    // ── Current-Scene: Ausgangsposition festhalten (nur bei regulärer Transition) ──

    if (!initial && currentPanel) {
      const currentPanelBaseOffset = getPanelBaseOffset(currentPanel);
      gsap.set(currentPanel, buildPanelState(currentPanel, {
        autoAlpha: 1,
        x: currentPanelBaseOffset.x,
        y: currentPanelBaseOffset.y,
        filter: "blur(0px)",
        zIndex: 2,
      }));
    }

    if (!initial && currentBackground) {
      gsap.set(currentBackground, {
        autoAlpha: 1,
        xPercent: 0,
        yPercent: 0,
        rotate: 0,
        scale: 1,
        filter: "blur(0px) brightness(1) saturate(1)",
        zIndex: 1,
      });
    }

    if (!initial && currentProgress) {
      gsap.set(currentProgress, {
        autoAlpha: 1,
        x: 0,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        zIndex: 2,
      });
      resetProgressLayers(currentProgressState || {});
    }

    // ── GSAP-Timeline ─────────────────────────────────────────────────────

    const timeline = gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete: () => {
        finishScene(nextIndex);
        root.classList.remove("is-transitioning");
        isTransitioning = false;
      },
    });

    // ── INITIAL-INTRO-ANIMATION ───────────────────────────────────────────

    if (initial) {
      root.dataset.scene = nextKey;
      controls.forEach((control) => {
        setControlState(control, control.dataset.sceneTarget === nextKey);
      });

      if (pieces.length) {
        pieces.forEach((piece) => {
          const config = getBurstConfig(piece);
          gsap.set(piece, {
            x: config.x,
            y: config.y,
            z: config.z,
            rotationX: config.rotationX,
            rotationY: config.rotationY,
            rotationZ: config.rotationZ,
            scale: config.scale,
            opacity: 0.08,
          });
        });
      }

      if (assembly) {
        gsap.set(assembly, {
          scale: 0.9,
          x: direction * 24,
          y: 0,
          rotationX: 18,
          rotationY: -12,
        });
      }

      gsap.set(shell, {
        x: direction * nextMotion.shellX,
        y: nextMotion.shellY,
        rotationX: nextMotion.shellRotateX,
        rotationY: direction * nextMotion.shellRotateY,
      });
      gsap.set(stage, {
        x: direction * nextMotion.stageX,
        y: nextMotion.stageY,
        rotationY: direction * nextMotion.stageRotateY,
        filter: "brightness(1.08)",
      });
      gsap.set(backgroundStage, {
        xPercent: direction * 3,
        yPercent: -1.5,
        scale: 1.03,
      });

      timeline.to(nextBackground, {
        autoAlpha: 1,
        xPercent: 0,
        yPercent: 0,
        rotate: 0,
        scale: 1,
        filter: "blur(0px) brightness(1) saturate(1)",
        duration: 0.86,
        ease: "power2.out",
      }, 0);

      if (nextProgress) {
        timeline.to(nextProgress, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.82,
          ease: "expo.out",
        }, 0.12);
      }

      if (nextLayers) {
        animateLayer(timeline, nextLayers.wash, {
          xPercent: 0, yPercent: 0, scale: 1, opacity: 1,
          duration: 0.92, ease: "expo.out",
        }, 0.02);
        animateLayer(timeline, nextLayers.shapeA, {
          xPercent: 0, yPercent: 0, rotate: 0, scale: 1,
          duration: 0.88, ease: "expo.out",
        }, 0.08);
        animateLayer(timeline, nextLayers.shapeB, {
          xPercent: 0, yPercent: 0, rotate: 0, scale: 1,
          duration: 0.92, ease: "expo.out",
        }, 0.12);
        animateLayer(timeline, nextLayers.grid, {
          xPercent: 0, yPercent: 0, scale: 1, opacity: 0.24,
          duration: 0.94, ease: "expo.out",
        }, 0.1);
      }

      timeline.to(nextPanel, buildPanelState(nextPanel, {
        autoAlpha: 1,
        x: nextPanelBaseOffset.x,
        y: nextPanelBaseOffset.y,
        filter: "blur(0px)",
        duration: 0.68,
        ease: "power3.out",
      }), 0.18);

      if (pieces.length) {
        timeline.to(pieces, {
          x: 0, y: 0, z: 0,
          rotationX: 0, rotationY: 0, rotationZ: 0,
          scale: 1, opacity: 1,
          duration: 0.9, ease: "expo.out",
          stagger: 0.028,
        }, 0.08);
      }

      if (assembly) {
        timeline.to(assembly, {
          scale: 1, x: 0, y: 0, rotationX: 0, rotationY: 0,
          duration: 0.94, ease: "expo.out",
        }, 0.08);
      }

      timeline.to(shell, {
        x: 0, y: 0, rotationX: 0, rotationY: 0,
        duration: 0.96, ease: "expo.out",
      }, 0.08);

      timeline.to(stage, {
        x: 0, y: 0, rotationY: 0, filter: "brightness(1)",
        duration: 0.94, ease: "expo.out",
      }, 0.08);

      timeline.to(backgroundStage, {
        xPercent: 0, yPercent: 0, scale: 1,
        duration: 0.94, ease: "expo.out",
      }, 0.08);

      return;
    }

    // ── EXIT-PHASE (aktuell sichtbare Scene verlässt) ─────────────────────

    timeline.to(currentPanel, buildPanelState(currentPanel, {
      autoAlpha: 0,
      x: getPanelBaseOffset(currentPanel).x + direction * -80,
      y: getPanelBaseOffset(currentPanel).y,
      filter: "blur(10px)",
      duration: 0.26,
      ease: "power2.in",
    }), 0);

    timeline.to(currentBackground, {
      autoAlpha: 0.16,
      xPercent: direction * currentMotion.exitX,
      yPercent: currentMotion.exitY,
      rotate: direction * currentMotion.exitRotate,
      scale: 0.96,
      filter: "blur(10px) brightness(0.9) saturate(0.84)",
      duration: 0.34,
      ease: "power2.inOut",
    }, 0);

    if (currentProgress) {
      timeline.to(currentProgress, {
        autoAlpha: 0.1,
        x: direction * -40,
        y: 14,
        scale: 0.92,
        filter: "blur(12px)",
        duration: 0.32,
        ease: "power2.in",
      }, 0);
    }

    if (currentLayers) {
      animateLayer(timeline, currentLayers.wash, {
        xPercent: direction * currentMotion.washX, yPercent: currentMotion.washY,
        scale: 1.12, opacity: 0.72,
        duration: 0.36, ease: "power2.inOut",
      }, 0);
      animateLayer(timeline, currentLayers.shapeA, {
        xPercent: direction * currentMotion.shapeAX, yPercent: currentMotion.shapeAY,
        rotate: direction * currentMotion.shapeARotate, scale: 1.06,
        duration: 0.36, ease: "power2.inOut",
      }, 0);
      animateLayer(timeline, currentLayers.shapeB, {
        xPercent: direction * currentMotion.shapeBX, yPercent: currentMotion.shapeBY,
        rotate: direction * currentMotion.shapeBRotate, scale: 1.08,
        duration: 0.36, ease: "power2.inOut",
      }, 0);
      animateLayer(timeline, currentLayers.grid, {
        xPercent: direction * currentMotion.gridX, yPercent: currentMotion.gridY,
        scale: 1.04, opacity: 0.1,
        duration: 0.34, ease: "power2.inOut",
      }, 0);
    }

    if (pieces.length) {
      timeline.to(pieces, {
        duration: 0.4,
        ease: "power3.in",
        x: (_, target) => getBurstConfig(target).x,
        y: (_, target) => getBurstConfig(target).y,
        z: (_, target) => getBurstConfig(target).z,
        rotationX: (_, target) => getBurstConfig(target).rotationX,
        rotationY: (_, target) => getBurstConfig(target).rotationY,
        rotationZ: (_, target) => getBurstConfig(target).rotationZ,
        scale: (_, target) => getBurstConfig(target).scale,
        opacity: 0.08,
        stagger: { each: 0.016, from: "center" },
      }, 0);
    }

    if (assembly) {
      timeline.to(assembly, {
        scale: 0.94, x: direction * -26, y: 0,
        rotationX: 14, rotationY: -8,
        duration: 0.42, ease: "power2.in",
      }, 0);
    }

    timeline.to(shell, {
      x: direction * currentMotion.shellX, y: currentMotion.shellY,
      rotationX: currentMotion.shellRotateX, rotationY: direction * currentMotion.shellRotateY,
      duration: 0.42, ease: "power2.in",
    }, 0);

    timeline.to(stage, {
      x: direction * currentMotion.stageX, y: currentMotion.stageY,
      rotationY: direction * currentMotion.stageRotateY,
      filter: "brightness(1.08)",
      duration: 0.42, ease: "power2.in",
    }, 0);

    timeline.to(backgroundStage, {
      xPercent: direction * 3, yPercent: -1.5, scale: 1.03,
      duration: 0.4, ease: "power2.in",
    }, 0);

    // ── CROSSFADE (t=0.22s) — Scene-Key + Hash umschalten ────────────────

    timeline.add(() => {
      root.dataset.scene = nextKey;
      controls.forEach((control) => {
        setControlState(control, control.dataset.sceneTarget === nextKey);
      });
      updateHash(nextKey);
    }, 0.22);

    // ── ENTER-PHASE (nächste Scene erscheint) ─────────────────────────────

    timeline.to(nextBackground, {
      autoAlpha: 1, xPercent: 0, yPercent: 0, rotate: 0, scale: 1,
      filter: "blur(0px) brightness(1) saturate(1)",
      duration: 0.7, ease: "power3.out",
    }, 0.22);

    if (nextProgress) {
      timeline.to(nextProgress, {
        autoAlpha: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)",
        duration: 0.74, ease: "expo.out",
      }, 0.24);
    }

    timeline.to(currentBackground, {
      autoAlpha: 0,
      xPercent: direction * currentMotion.exitX * 1.35,
      yPercent: currentMotion.exitY,
      rotate: direction * currentMotion.exitRotate,
      scale: 1.05,
      filter: "blur(18px) brightness(0.84) saturate(0.7)",
      duration: 0.62, ease: "power3.out",
    }, 0.22);

    if (currentProgress) {
      timeline.to(currentProgress, {
        autoAlpha: 0,
        x: direction * currentMotion.exitX * 4,
        y: currentMotion.exitY * 8,
        scale: 1.04, filter: "blur(18px)",
        duration: 0.6, ease: "power3.out",
      }, 0.22);
    }

    if (nextLayers) {
      animateLayer(timeline, nextLayers.wash, {
        xPercent: 0, yPercent: 0, scale: 1, opacity: 1,
        duration: 0.82, ease: "expo.out",
      }, 0.22);
      animateLayer(timeline, nextLayers.shapeA, {
        xPercent: 0, yPercent: 0, rotate: 0, scale: 1,
        duration: 0.78, ease: "expo.out",
      }, 0.26);
      animateLayer(timeline, nextLayers.shapeB, {
        xPercent: 0, yPercent: 0, rotate: 0, scale: 1,
        duration: 0.8, ease: "expo.out",
      }, 0.3);
      animateLayer(timeline, nextLayers.grid, {
        xPercent: 0, yPercent: 0, scale: 1, opacity: 0.24,
        duration: 0.82, ease: "expo.out",
      }, 0.28);
    }

    timeline.to(nextPanel, buildPanelState(nextPanel, {
      autoAlpha: 1,
      x: nextPanelBaseOffset.x, y: nextPanelBaseOffset.y,
      filter: "blur(0px)",
      duration: 0.56, ease: "power3.out",
    }), 0.38);

    if (pieces.length) {
      timeline.to(pieces, {
        x: 0, y: 0, z: 0,
        rotationX: 0, rotationY: 0, rotationZ: 0,
        scale: 1, opacity: 1,
        duration: 0.76, ease: "expo.out",
        stagger: { each: 0.02, from: "edges" },
      }, 0.28);
    }

    if (assembly) {
      timeline.to(assembly, {
        scale: 1, x: 0, y: 0, rotationX: 0, rotationY: 0,
        duration: 0.86, ease: "expo.out",
      }, 0.28);
    }

    timeline.to(shell, {
      x: 0, y: 0, rotationX: 0, rotationY: 0,
      duration: 0.88, ease: "expo.out",
    }, 0.28);

    timeline.to(stage, {
      x: 0, y: 0, rotationY: 0, filter: "brightness(1)",
      duration: 0.88, ease: "expo.out",
    }, 0.28);

    timeline.to(backgroundStage, {
      xPercent: 0, yPercent: 0, scale: 1,
      duration: 0.88, ease: "expo.out",
    }, 0.28);
  };

  // ── Event-Listener ────────────────────────────────────────────────────────

  controls.forEach((control) => {
    control.addEventListener("click", (event) => {
      const key = control.dataset.sceneTarget;

      if (!key || !sceneKeys.includes(key)) return;

      if (control.tagName === "A") {
        event.preventDefault();
      }

      transitionTo(sceneKeys.indexOf(key));
    });
  });

  arrows.forEach((arrow) => {
    arrow.addEventListener("click", () => {
      const step = Number(arrow.dataset.sceneStep || 0);
      transitionTo(activeIndex + step);
    });
  });

  tabs.forEach((tab) => {
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

      event.preventDefault();
      const dir = event.key === "ArrowRight" ? 1 : -1;
      const nextIdx = wrapIndex(activeIndex + dir, sceneKeys.length);

      tabs[nextIdx]?.focus();
      transitionTo(nextIdx);
    });
  });

  // ── Feature-Flags auswerten ───────────────────────────────────────────────

  if (reduceMotion) {
    finishScene(activeIndex);
    return;
  }

  const { disableInteractiveDrift, skipInitialSceneIntro } = FEATURE_FLAGS;

  if (disableInteractiveDrift && skipInitialSceneIntro) {
    // Sofortige Scene — kein Intro-Tween, kein Drift-Loop.
    finishScene(activeIndex);
    return;
  }

  if (disableInteractiveDrift) {
    // Intro-Tween abspielen, aber danach kein Drift-Loop starten.
    transitionTo(activeIndex, { initial: true });
    return;
  }

  // ── Interaktiver Drift-Modus ──────────────────────────────────────────────

  const drift = createDriftController({
    stage,
    driftLayer,
    getState: () => ({ isTransitioning, activeIndex }),
    sceneKeys,
    backgroundMap,
    backgroundLayers,
  });

  drift.start();
  transitionTo(activeIndex, { initial: true });
}
