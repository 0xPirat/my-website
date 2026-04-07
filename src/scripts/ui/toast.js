/**
 * toast.js — Minimales Toast/Banner-System für kritische Fehler.
 *
 * Verwendung:
 *   import { showToast } from "./toast.js";
 *   showToast("Nachricht");
 *   showToast("Warnung", { type: "warning" });
 *   showToast("Info", { type: "info", duration: 4000 });
 */

const CONTAINER_ID = "buildit-toast-container";
const ICONS = {
  error: "⚠",
  warning: "⚡",
  info: "ℹ",
};

let _container = null;
let _idCounter = 0;

function getContainer() {
  if (_container && document.body.contains(_container)) {
    return _container;
  }

  _container = document.createElement("div");
  _container.id = CONTAINER_ID;
  _container.setAttribute("aria-live", "assertive");
  _container.setAttribute("aria-atomic", "false");
  _container.setAttribute("role", "status");
  document.body.appendChild(_container);

  return _container;
}

/**
 * Zeigt ein Toast-Banner an.
 *
 * @param {string} message   - Der anzuzeigende Text.
 * @param {{ type?: 'error'|'warning'|'info', duration?: number }} options
 */
export function showToast(message, { type = "error", duration = 5500 } = {}) {
  if (typeof document === "undefined" || !message) {
    return;
  }

  const container = getContainer();
  const id = `buildit-toast-${(_idCounter += 1)}`;

  const toast = document.createElement("div");
  toast.id = id;
  toast.className = `buildit-toast buildit-toast--${type}`;
  toast.setAttribute("role", type === "error" ? "alert" : "status");

  const icon = document.createElement("span");
  icon.className = "buildit-toast__icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = ICONS[type] ?? ICONS.info;

  const text = document.createElement("span");
  text.className = "buildit-toast__text";
  text.textContent = message;

  const close = document.createElement("button");
  close.className = "buildit-toast__close";
  close.setAttribute("aria-label", "Meldung schließen");
  close.textContent = "✕";
  close.addEventListener("click", () => dismiss(id), { once: true });

  toast.append(icon, text, close);
  container.appendChild(toast);

  // Trigger animation in next frame
  requestAnimationFrame(() => {
    toast.classList.add("buildit-toast--visible");
  });

  if (duration > 0) {
    setTimeout(() => dismiss(id), duration);
  }

  return id;
}

/**
 * Entfernt einen Toast per ID.
 *
 * @param {string} id
 */
export function dismissToast(id) {
  dismiss(id);
}

function dismiss(id) {
  const toast = document.getElementById(id);

  if (!toast) {
    return;
  }

  toast.classList.remove("buildit-toast--visible");
  toast.classList.add("buildit-toast--hiding");

  toast.addEventListener(
    "transitionend",
    () => {
      toast.remove();

      // Container entfernen wenn leer
      if (_container && _container.children.length === 0) {
        _container.remove();
        _container = null;
      }
    },
    { once: true },
  );
}
