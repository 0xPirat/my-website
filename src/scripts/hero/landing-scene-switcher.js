import { gsap } from "../../../public/vendor/gsap/index.js";
import { buildSceneHash, parseSceneHash } from "../config/scene-pages.js";

const PIECE_BURST = Object.freeze({
  "prism-left": { x: -250, y: -150, z: -260, rotationX: -20, rotationY: 28, rotationZ: -18, scale: 0.76 },
  "prism-right": { x: 240, y: -130, z: -240, rotationX: 16, rotationY: -30, rotationZ: 16, scale: 0.78 },
  beam: { x: -140, y: 80, z: -220, rotationX: 8, rotationY: 14, rotationZ: -10, scale: 0.8 },
  node: { x: 170, y: 126, z: -190, rotationX: 22, rotationY: -18, rotationZ: 18, scale: 0.76 },
});

const SCENE_MOTION = Object.freeze({
  "warum-wir": {
    enterX: 12,
    enterY: -4,
    enterRotate: 1.8,
    exitX: -9,
    exitY: 3,
    exitRotate: -1.6,
    shellX: -28,
    shellY: 12,
    shellRotateX: 1.6,
    shellRotateY: -4.4,
    stageX: -20,
    stageY: 12,
    stageRotateY: -7,
    parallaxX: 18,
    parallaxY: 10,
    floatX: 10,
    floatY: 8,
    washX: -20,
    washY: -14,
    shapeAX: -12,
    shapeAY: 10,
    shapeARotate: -5,
    shapeBX: 18,
    shapeBY: -8,
    shapeBRotate: 4,
    gridX: -10,
    gridY: 8,
  },
  schablonen: {
    enterX: 15,
    enterY: -2,
    enterRotate: 2.2,
    exitX: -12,
    exitY: 2,
    exitRotate: -1.8,
    shellX: -18,
    shellY: 8,
    shellRotateX: 1.4,
    shellRotateY: -3.6,
    stageX: -14,
    stageY: 8,
    stageRotateY: -5,
    parallaxX: 5,
    parallaxY: 3,
    floatX: 2,
    floatY: 1.5,
    washX: 22,
    washY: -12,
    shapeAX: -18,
    shapeAY: 12,
    shapeARotate: -6,
    shapeBX: 16,
    shapeBY: -10,
    shapeBRotate: 3,
    gridX: 10,
    gridY: -6,
  },
  arbeit: {
    enterX: 10,
    enterY: 3,
    enterRotate: 1.6,
    exitX: -14,
    exitY: -2,
    exitRotate: -2.1,
    shellX: -32,
    shellY: 14,
    shellRotateX: 1.8,
    shellRotateY: -4.8,
    stageX: -24,
    stageY: 10,
    stageRotateY: -7.4,
    parallaxX: 20,
    parallaxY: 12,
    floatX: 10,
    floatY: 8,
    washX: 18,
    washY: -18,
    shapeAX: -22,
    shapeAY: 10,
    shapeARotate: -7,
    shapeBX: 22,
    shapeBY: -12,
    shapeBRotate: 5,
    gridX: 14,
    gridY: 10,
  },
  "unser-team": {
    enterX: 13,
    enterY: -3,
    enterRotate: 1.7,
    exitX: -10,
    exitY: 2,
    exitRotate: -1.5,
    shellX: -20,
    shellY: 8,
    shellRotateX: 1.3,
    shellRotateY: -3.2,
    stageX: -14,
    stageY: 8,
    stageRotateY: -4.6,
    parallaxX: 12,
    parallaxY: 7,
    floatX: 7,
    floatY: 5,
    washX: -12,
    washY: -10,
    shapeAX: -10,
    shapeAY: 6,
    shapeARotate: -2,
    shapeBX: 12,
    shapeBY: -6,
    shapeBRotate: 2,
    gridX: 8,
    gridY: -6,
  },
});

const SCENE_PANEL_BASE_OFFSETS = Object.freeze({
  "warum-wir": { x: 0, y: -200 },
  schablonen: { x: 0, y: -200 },
  arbeit: { x: 0, y: -200 },
  "unser-team": { x: 0, y: -200 },
});

const SCENE_PANEL_REST_TRANSFORMS = Object.freeze({
  "warum-wir": { transformPerspective: 1760, transformOrigin: "0% 52%" },
  schablonen: { transformPerspective: 1780, transformOrigin: "0% 52%" },
  arbeit: { transformPerspective: 1770, transformOrigin: "0% 52%" },
  "unser-team": { transformPerspective: 1800, transformOrigin: "0% 52%" },
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function wrapIndex(index, total) {
  return ((index % total) + total) % total;
}

function getSceneMotion(key) {
  return SCENE_MOTION[key] || SCENE_MOTION["warum-wir"];
}

function getPanelBaseOffset(panelOrKey) {
  const key = typeof panelOrKey === "string" ? panelOrKey : panelOrKey?.dataset.scenePanel;
  const baseOffset = SCENE_PANEL_BASE_OFFSETS[key] || { x: 0, y: 0 };

  if (typeof window !== "undefined" && window.matchMedia("(max-width: 980px)").matches) {
    return { x: 0, y: 0 };
  }

  return baseOffset;
}

function getPanelRestTransform(panelOrKey) {
  const key = typeof panelOrKey === "string" ? panelOrKey : panelOrKey?.dataset.scenePanel;
  return SCENE_PANEL_REST_TRANSFORMS[key] || {
    transformPerspective: 0,
    transformOrigin: "50% 50%",
  };
}

function buildPanelState(panelOrKey, state) {
  const restTransform = getPanelRestTransform(panelOrKey);

  return {
    z: 0,
    scale: 1,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    skewY: 0,
    transformPerspective: restTransform.transformPerspective,
    transformOrigin: restTransform.transformOrigin,
    ...state,
  };
}

function getDirection(currentIndex, nextIndex, total) {
  const delta = nextIndex - currentIndex;

  if (Math.abs(delta) === total - 1) {
    return delta > 0 ? -1 : 1;
  }

  return delta >= 0 ? 1 : -1;
}

function setControlState(control, active) {
  control.classList.toggle("is-active", active);

  if (control.getAttribute("role") === "tab") {
    control.setAttribute("aria-selected", String(active));
    control.tabIndex = active ? 0 : -1;
    return;
  }

  if (active) {
    control.setAttribute("aria-current", "location");
    return;
  }

  control.removeAttribute("aria-current");
}

function setSceneState({ root, panels, backgrounds, progressScenes, controls, key }) {
  root.dataset.scene = key;

  panels.forEach((panel) => {
    const active = panel.dataset.scenePanel === key;
    const baseOffset = getPanelBaseOffset(panel);
    panel.classList.toggle("is-active", active);
    gsap.set(panel, buildPanelState(panel, {
      autoAlpha: active ? 1 : 0,
      x: active ? baseOffset.x : baseOffset.x + 48,
      y: baseOffset.y,
      filter: active ? "blur(0px)" : "blur(10px)",
      zIndex: active ? 2 : 0,
    }));
  });

  backgrounds.forEach((background) => {
    const active = background.dataset.sceneBg === key;
    background.classList.toggle("is-active", active);
    gsap.set(background, {
      autoAlpha: active ? 1 : 0,
      xPercent: 0,
      yPercent: 0,
      rotate: 0,
      scale: 1,
      filter: "blur(0px) brightness(1) saturate(1)",
      zIndex: active ? 1 : 0,
    });
  });

  progressScenes.forEach((progressScene) => {
    const active = progressScene.dataset.sceneProgress === key;
    progressScene.classList.toggle("is-active", active);
    gsap.set(progressScene, {
      autoAlpha: active ? 1 : 0,
      x: 0,
      y: 0,
      scale: active ? 1 : 0.98,
      filter: "blur(0px)",
      zIndex: active ? 2 : 0,
    });
  });

  controls.forEach((control) => {
    setControlState(control, control.dataset.sceneTarget === key);
  });
}

function getBurstConfig(piece) {
  return PIECE_BURST[piece.dataset.piece] || {
    x: 0,
    y: 0,
    z: -180,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    scale: 0.84,
  };
}

function getBackgroundLayers(background) {
  return {
    wash: background.querySelector(".scene-background__wash"),
    shapeA: background.querySelector(".scene-background__shape--a"),
    shapeB: background.querySelector(".scene-background__shape--b"),
    grid: background.querySelector(".scene-background__grid"),
  };
}

function getProgressLayers(progressScene) {
  return {
    halo: progressScene?.querySelector(".scene-progress__halo") ?? null,
    beam: progressScene?.querySelector(".scene-progress__beam") ?? null,
    portal: progressScene?.querySelector(".scene-progress__portal") ?? null,
    lead: progressScene?.querySelector(".scene-progress__frame--lead") ?? null,
    mid: progressScene?.querySelector(".scene-progress__frame--mid") ?? null,
    tail: progressScene?.querySelector(".scene-progress__frame--tail") ?? null,
    caption: progressScene?.querySelector(".scene-progress__caption") ?? null,
  };
}

function setLayer(layer, props) {
  if (!layer) {
    return;
  }

  gsap.set(layer, props);
}

function animateLayer(timeline, layer, props, position) {
  if (!layer) {
    return;
  }

  timeline.to(layer, props, position);
}

function resetBackgroundLayers(layers) {
  const items = [layers.wash, layers.shapeA, layers.shapeB, layers.grid].filter(Boolean);

  if (!items.length) {
    return;
  }

  gsap.set(items, {
    xPercent: 0,
    yPercent: 0,
    rotate: 0,
    scale: 1,
    opacity: 1,
    filter: "blur(0px)",
  });
}

function resetProgressLayers(layers) {
  const items = [
    layers.halo,
    layers.beam,
    layers.portal,
    layers.lead,
    layers.mid,
    layers.tail,
    layers.caption,
  ].filter(Boolean);

  if (!items.length) {
    return;
  }

  gsap.set(items, {
    clearProps: "transform,opacity,filter",
  });
}

export function initLandingSceneSwitcher({ reduceMotion = false } = {}) {
  const root = document.querySelector("[data-scene-root]");

  if (!root) {
    return;
  }

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

  let activeKey = parseSceneHash(window.location.hash) || root.dataset.scene || sceneKeys[0];

  if (!sceneKeys.includes(activeKey)) {
    activeKey = sceneKeys[0];
  }

  let activeIndex = sceneKeys.indexOf(activeKey);
  let isTransitioning = false;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;

  const panelMap = new Map(panels.map((panel) => [panel.dataset.scenePanel, panel]));
  const backgroundMap = new Map(backgrounds.map((background) => [background.dataset.sceneBg, background]));
  const backgroundLayers = new Map(
    backgrounds.map((background) => [background.dataset.sceneBg, getBackgroundLayers(background)])
  );
  const progressMap = new Map(
    progressScenes.map((progressScene) => [progressScene.dataset.sceneProgress, progressScene]),
  );
  const progressLayers = new Map(
    progressScenes.map((progressScene) => [progressScene.dataset.sceneProgress, getProgressLayers(progressScene)]),
  );

  const updateHash = (key) => {
    const nextHash = buildSceneHash(key);

    if (window.location.hash === nextHash) {
      return;
    }

    if (history.replaceState) {
      history.replaceState(null, "", nextHash);
      return;
    }

    window.location.hash = nextHash;
  };

  const finishScene = (index) => {
    activeIndex = index;
    setSceneState({
      root,
      panels,
      backgrounds,
      progressScenes,
      controls,
      key: sceneKeys[index],
    });
    resetBackgroundLayers(backgroundLayers.get(sceneKeys[index]) || {});
    resetProgressLayers(progressLayers.get(sceneKeys[index]) || {});
    updateHash(sceneKeys[index]);
  };

  const transitionTo = (requestedIndex, { initial = false } = {}) => {
    const nextIndex = wrapIndex(requestedIndex, sceneKeys.length);

    if (isTransitioning || (!initial && nextIndex === activeIndex)) {
      return;
    }

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
      progressScenes.forEach((progressScene) => {
        resetProgressLayers(progressLayers.get(progressScene.dataset.sceneProgress) || {});
      });
    }

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

    const timeline = gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete: () => {
        finishScene(nextIndex);
        root.classList.remove("is-transitioning");
        isTransitioning = false;
      },
    });

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
          xPercent: 0,
          yPercent: 0,
          scale: 1,
          opacity: 1,
          duration: 0.92,
          ease: "expo.out",
        }, 0.02);
        animateLayer(timeline, nextLayers.shapeA, {
          xPercent: 0,
          yPercent: 0,
          rotate: 0,
          scale: 1,
          duration: 0.88,
          ease: "expo.out",
        }, 0.08);
        animateLayer(timeline, nextLayers.shapeB, {
          xPercent: 0,
          yPercent: 0,
          rotate: 0,
          scale: 1,
          duration: 0.92,
          ease: "expo.out",
        }, 0.12);
        animateLayer(timeline, nextLayers.grid, {
          xPercent: 0,
          yPercent: 0,
          scale: 1,
          opacity: 0.24,
          duration: 0.94,
          ease: "expo.out",
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
          x: 0,
          y: 0,
          z: 0,
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          scale: 1,
          opacity: 1,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.028,
        }, 0.08);
      }

      if (assembly) {
        timeline.to(assembly, {
          scale: 1,
          x: 0,
          y: 0,
          rotationX: 0,
          rotationY: 0,
          duration: 0.94,
          ease: "expo.out",
        }, 0.08);
      }

      timeline.to(shell, {
        x: 0,
        y: 0,
        rotationX: 0,
        rotationY: 0,
        duration: 0.96,
        ease: "expo.out",
      }, 0.08);

      timeline.to(stage, {
        x: 0,
        y: 0,
        rotationY: 0,
        filter: "brightness(1)",
        duration: 0.94,
        ease: "expo.out",
      }, 0.08);

      timeline.to(backgroundStage, {
        xPercent: 0,
        yPercent: 0,
        scale: 1,
        duration: 0.94,
        ease: "expo.out",
      }, 0.08);

      return;
    }

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
        xPercent: direction * currentMotion.washX,
        yPercent: currentMotion.washY,
        scale: 1.12,
        opacity: 0.72,
        duration: 0.36,
        ease: "power2.inOut",
      }, 0);
      animateLayer(timeline, currentLayers.shapeA, {
        xPercent: direction * currentMotion.shapeAX,
        yPercent: currentMotion.shapeAY,
        rotate: direction * currentMotion.shapeARotate,
        scale: 1.06,
        duration: 0.36,
        ease: "power2.inOut",
      }, 0);
      animateLayer(timeline, currentLayers.shapeB, {
        xPercent: direction * currentMotion.shapeBX,
        yPercent: currentMotion.shapeBY,
        rotate: direction * currentMotion.shapeBRotate,
        scale: 1.08,
        duration: 0.36,
        ease: "power2.inOut",
      }, 0);
      animateLayer(timeline, currentLayers.grid, {
        xPercent: direction * currentMotion.gridX,
        yPercent: currentMotion.gridY,
        scale: 1.04,
        opacity: 0.1,
        duration: 0.34,
        ease: "power2.inOut",
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
        scale: 0.94,
        x: direction * -26,
        y: 0,
        rotationX: 14,
        rotationY: -8,
        duration: 0.42,
        ease: "power2.in",
      }, 0);
    }

    timeline.to(shell, {
      x: direction * currentMotion.shellX,
      y: currentMotion.shellY,
      rotationX: currentMotion.shellRotateX,
      rotationY: direction * currentMotion.shellRotateY,
      duration: 0.42,
      ease: "power2.in",
    }, 0);

    timeline.to(stage, {
      x: direction * currentMotion.stageX,
      y: currentMotion.stageY,
      rotationY: direction * currentMotion.stageRotateY,
      filter: "brightness(1.08)",
      duration: 0.42,
      ease: "power2.in",
    }, 0);

    timeline.to(backgroundStage, {
      xPercent: direction * 3,
      yPercent: -1.5,
      scale: 1.03,
      duration: 0.4,
      ease: "power2.in",
    }, 0);

    timeline.add(() => {
      root.dataset.scene = nextKey;
      controls.forEach((control) => {
        setControlState(control, control.dataset.sceneTarget === nextKey);
      });
      updateHash(nextKey);
    }, 0.22);

    timeline.to(nextBackground, {
      autoAlpha: 1,
      xPercent: 0,
      yPercent: 0,
      rotate: 0,
      scale: 1,
      filter: "blur(0px) brightness(1) saturate(1)",
      duration: 0.7,
      ease: "power3.out",
    }, 0.22);

    if (nextProgress) {
      timeline.to(nextProgress, {
        autoAlpha: 1,
        x: 0,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.74,
        ease: "expo.out",
      }, 0.24);
    }

    timeline.to(currentBackground, {
      autoAlpha: 0,
      xPercent: direction * currentMotion.exitX * 1.35,
      yPercent: currentMotion.exitY,
      rotate: direction * currentMotion.exitRotate,
      scale: 1.05,
      filter: "blur(18px) brightness(0.84) saturate(0.7)",
      duration: 0.62,
      ease: "power3.out",
    }, 0.22);

    if (currentProgress) {
      timeline.to(currentProgress, {
        autoAlpha: 0,
        x: direction * currentMotion.exitX * 4,
        y: currentMotion.exitY * 8,
        scale: 1.04,
        filter: "blur(18px)",
        duration: 0.6,
        ease: "power3.out",
      }, 0.22);
    }

    if (nextLayers) {
      animateLayer(timeline, nextLayers.wash, {
        xPercent: 0,
        yPercent: 0,
        scale: 1,
        opacity: 1,
        duration: 0.82,
        ease: "expo.out",
      }, 0.22);
      animateLayer(timeline, nextLayers.shapeA, {
        xPercent: 0,
        yPercent: 0,
        rotate: 0,
        scale: 1,
        duration: 0.78,
        ease: "expo.out",
      }, 0.26);
      animateLayer(timeline, nextLayers.shapeB, {
        xPercent: 0,
        yPercent: 0,
        rotate: 0,
        scale: 1,
        duration: 0.8,
        ease: "expo.out",
      }, 0.3);
      animateLayer(timeline, nextLayers.grid, {
        xPercent: 0,
        yPercent: 0,
        scale: 1,
        opacity: 0.24,
        duration: 0.82,
        ease: "expo.out",
      }, 0.28);
    }

    timeline.to(nextPanel, buildPanelState(nextPanel, {
      autoAlpha: 1,
      x: nextPanelBaseOffset.x,
      y: nextPanelBaseOffset.y,
      filter: "blur(0px)",
      duration: 0.56,
      ease: "power3.out",
    }), 0.38);

    if (pieces.length) {
      timeline.to(pieces, {
        x: 0,
        y: 0,
        z: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        scale: 1,
        opacity: 1,
        duration: 0.76,
        ease: "expo.out",
        stagger: { each: 0.02, from: "edges" },
      }, 0.28);
    }

    if (assembly) {
      timeline.to(assembly, {
        scale: 1,
        x: 0,
        y: 0,
        rotationX: 0,
        rotationY: 0,
        duration: 0.86,
        ease: "expo.out",
      }, 0.28);
    }

    timeline.to(shell, {
      x: 0,
      y: 0,
      rotationX: 0,
      rotationY: 0,
      duration: 0.88,
      ease: "expo.out",
    }, 0.28);

    timeline.to(stage, {
      x: 0,
      y: 0,
      rotationY: 0,
      filter: "brightness(1)",
      duration: 0.88,
      ease: "expo.out",
    }, 0.28);

    timeline.to(backgroundStage, {
      xPercent: 0,
      yPercent: 0,
      scale: 1,
      duration: 0.88,
      ease: "expo.out",
    }, 0.28);
  };

  controls.forEach((control) => {
    control.addEventListener("click", (event) => {
      const key = control.dataset.sceneTarget;

      if (!key || !sceneKeys.includes(key)) {
        return;
      }

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
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = wrapIndex(activeIndex + direction, sceneKeys.length);

      tabs[nextIndex]?.focus();
      transitionTo(nextIndex);
    });
  });

  if (reduceMotion) {
    finishScene(activeIndex);
    return;
  }

  const disableInteractiveDrift = true;
  const skipInitialSceneIntro = true;

  if (disableInteractiveDrift && skipInitialSceneIntro) {
    // Show the settled first scene immediately on page entry.
    finishScene(activeIndex);
    return;
  }

  if (disableInteractiveDrift) {
    transitionTo(activeIndex, { initial: true });
    return;
  }

  const handlePointerMove = (event) => {
    const rect = stage.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;

    targetX = clamp(x, -1, 1);
    targetY = clamp(y, -1, 1);
  };

  const handlePointerLeave = () => {
    targetX = 0;
    targetY = 0;
  };

  const tick = () => {
    pointerX += (targetX - pointerX) * 0.08;
    pointerY += (targetY - pointerY) * 0.08;

    const time = performance.now() * 0.001;
    const driftX = Math.sin(time * 0.82) * 8 + pointerX * 26;
    const driftY = Math.cos(time * 0.9) * 6 + pointerY * 18;
    const activeKeyNow = sceneKeys[activeIndex];
    const activeMotion = getSceneMotion(activeKeyNow);
    const activeBackground = backgroundMap.get(activeKeyNow);
    const activeLayers = backgroundLayers.get(activeKeyNow);

    if (driftLayer) {
      driftLayer.style.transform =
        `translate3d(${driftX.toFixed(2)}px, ${driftY.toFixed(2)}px, 0) ` +
        `rotateX(${(-pointerY * 5).toFixed(3)}deg) rotateY(${(pointerX * 7).toFixed(3)}deg)`;
    }

    stage.style.setProperty("--hero-light-x", `${(50 + pointerX * 9).toFixed(2)}%`);
    stage.style.setProperty("--hero-light-y", `${(25 + pointerY * 8).toFixed(2)}%`);
    stage.style.setProperty("--hero-drift-x", `${(pointerX * 22).toFixed(2)}px`);
    stage.style.setProperty("--hero-drift-y", `${(pointerY * 18).toFixed(2)}px`);
    stage.style.setProperty("--hero-tilt-x", (pointerY * -6).toFixed(3));
    stage.style.setProperty("--hero-tilt-y", (pointerX * 8).toFixed(3));

    if (isTransitioning || !activeBackground || !activeLayers) {
      return;
    }

    gsap.set(activeBackground, {
      xPercent: pointerX * activeMotion.parallaxX * 0.18 + Math.sin(time * 0.22) * activeMotion.floatX * 0.08,
      yPercent: pointerY * activeMotion.parallaxY * 0.22 + Math.cos(time * 0.18) * activeMotion.floatY * 0.08,
      rotate: pointerX * 0.9,
    });

    gsap.set(activeLayers.wash, {
      xPercent: pointerX * activeMotion.parallaxX + Math.sin(time * 0.34) * activeMotion.floatX,
      yPercent: pointerY * activeMotion.parallaxY + Math.cos(time * 0.28) * activeMotion.floatY,
      scale: 1.04 + Math.sin(time * 0.24) * 0.015,
    });

    gsap.set(activeLayers.shapeA, {
      xPercent: pointerX * activeMotion.shapeAX * -0.36 + Math.sin(time * 0.3) * activeMotion.floatX * 0.42,
      yPercent: pointerY * activeMotion.shapeAY * 0.42 + Math.cos(time * 0.25) * activeMotion.floatY * 0.36,
      rotate: pointerX * activeMotion.shapeARotate * 0.16,
    });

    gsap.set(activeLayers.shapeB, {
      xPercent: pointerX * activeMotion.shapeBX * 0.32 + Math.cos(time * 0.32) * activeMotion.floatX * 0.34,
      yPercent: pointerY * activeMotion.shapeBY * 0.38 + Math.sin(time * 0.27) * activeMotion.floatY * 0.32,
      rotate: pointerX * activeMotion.shapeBRotate * 0.18,
    });

    gsap.set(activeLayers.grid, {
      xPercent: pointerX * activeMotion.gridX * 0.42,
      yPercent: pointerY * activeMotion.gridY * 0.42 + Math.cos(time * 0.22) * activeMotion.floatY * 0.24,
    });
  };

  stage.addEventListener("pointermove", handlePointerMove);
  stage.addEventListener("pointerleave", handlePointerLeave);
  stage.addEventListener("pointercancel", handlePointerLeave);
  gsap.ticker.add(tick);

  transitionTo(activeIndex, { initial: true });
}
