(() => {
  if (window.location.protocol !== "file:") {
    return;
  }

  document.documentElement.classList.add("is-file-protocol");

  function getPageName() {
    const segments = window.location.pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] || "index.html";

    return decodeURIComponent(lastSegment);
  }

  function mountProtocolGate() {
    if (!document.body || document.getElementById("protocol-gate")) {
      return;
    }

    const pageName = getPageName();
    const previewUrl = `http://localhost:8000/${encodeURI(pageName)}`;
    const gate = document.createElement("section");

    gate.className = "protocol-gate";
    gate.id = "protocol-gate";
    gate.setAttribute("aria-label", "Localhost Hinweis");
    gate.innerHTML = `
      <div class="protocol-gate__panel glass-card">
        <p class="eyebrow">Localhost only</p>
        <h1>Diese Vorschau ist absichtlich blockiert.</h1>
        <p class="protocol-gate__lead">
          buildIT soll nur ueber den lokalen Server bearbeitet werden. Nur dort siehst du
          die echte aktuelle Seite inklusive Animationen, Three.js-Szenen und Scroll-Verhalten.
        </p>

        <div class="protocol-gate__meta" role="list">
          <div class="protocol-gate__item" role="listitem">
            <span class="protocol-gate__label">Aktuelle Datei</span>
            <strong>${pageName}</strong>
          </div>

          <div class="protocol-gate__item" role="listitem">
            <span class="protocol-gate__label">Kanonische Vorschau</span>
            <a class="protocol-gate__url" href="${previewUrl}">${previewUrl}</a>
          </div>
        </div>

        <div class="protocol-gate__actions">
          <a class="btn btn-primary" href="${previewUrl}">Zu localhost wechseln</a>
        </div>

        <p class="protocol-gate__note">
          Falls der Link noch nicht funktioniert, starte im Projektordner <code>npm run dev</code>.
        </p>
      </div>
    `;

    document.body.prepend(gate);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountProtocolGate, { once: true });
  } else {
    mountProtocolGate();
  }
})();
