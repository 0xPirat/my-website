export const SCENE_TRANSITION_STORAGE_KEY = "buildit-scene-entry";

export const SCENE_PAGE_CONFIG = Object.freeze([
  {
    key: "warum-wir",
    label: "Warum wir",
    navLabel: "Warum Wir",
    route: "warum-wir.html",
  },
  {
    key: "schablonen",
    label: "Schablonen",
    navLabel: "Schablonen",
    route: "Schablonen.html",
  },
  {
    key: "arbeit",
    label: "Arbeiten",
    navLabel: "Arbeiten",
    route: "Our_worke_in_Action.html",
  },
  {
    key: "unser-team",
    label: "Unser Team",
    navLabel: "Unser Team",
    route: "unser-team.html",
  },
]);

const SCENE_PAGE_MAP = new Map(
  SCENE_PAGE_CONFIG.map((entry) => [entry.key, entry]),
);

export function getScenePage(key) {
  return SCENE_PAGE_MAP.get(key) || SCENE_PAGE_MAP.get("warum-wir");
}

export function getScenePageRoute(key) {
  return getScenePage(key).route;
}

export function buildSceneHash(key) {
  return `#scene=${getScenePage(key).key}`;
}

export function buildSceneLandingUrl(key) {
  return `index.html${buildSceneHash(key)}`;
}

export function parseSceneHash(hash) {
  const value = String(hash || "").replace(/^#/, "").trim();

  if (!value) {
    return null;
  }

  if (value.startsWith("scene=")) {
    const key = value.slice("scene=".length);
    return SCENE_PAGE_MAP.has(key) ? key : null;
  }

  if (value.startsWith("scene-")) {
    const key = value.slice("scene-".length);
    return SCENE_PAGE_MAP.has(key) ? key : null;
  }

  return SCENE_PAGE_MAP.has(value) ? value : null;
}
