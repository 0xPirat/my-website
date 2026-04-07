import { showToast } from "./toast.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Zeigt einen inline-Fehlerhinweis unterhalb eines Feldes an.
 * Wird beim nächsten `input`-Event automatisch entfernt.
 */
function setFieldError(field, message) {
  field.setAttribute("aria-invalid", "true");

  const existingHint = field.parentElement?.querySelector(".contact-field-error");

  if (existingHint) {
    existingHint.textContent = message;
    return;
  }

  const hint = document.createElement("p");
  hint.className = "contact-field-error";
  hint.setAttribute("role", "alert");
  hint.textContent = message;
  field.insertAdjacentElement("afterend", hint);

  const clearError = () => {
    field.removeAttribute("aria-invalid");
    hint.remove();
    field.removeEventListener("input", clearError);
  };

  field.addEventListener("input", clearError);
}

function clearAllErrors(form) {
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  form.querySelectorAll(".contact-field-error").forEach((el) => el.remove());
}

export function initContactForm() {
  const contactForm = document.querySelector(".contact-form");

  if (!contactForm) {
    return;
  }

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearAllErrors(contactForm);

    const formData = new FormData(contactForm);
    const name    = (formData.get("name")    || "").toString().trim();
    const email   = (formData.get("email")   || "").toString().trim();
    const phone   = (formData.get("phone")   || "").toString().trim();
    const company = (formData.get("company") || "").toString().trim();
    const message = (formData.get("message") || "").toString().trim();
    const projectLine = (formData.get("estimateSelection") || "").toString().trim();

    // ── Validierung ──────────────────────────────────────────────────────────
    let hasError = false;

    const nameField  = contactForm.querySelector('[name="name"]');
    const emailField = contactForm.querySelector('[name="email"]');
    const msgField   = contactForm.querySelector('[name="message"]');

    if (!name) {
      if (nameField) setFieldError(nameField, "Bitte deinen Namen eingeben.");
      hasError = true;
    }

    if (!email) {
      if (emailField) setFieldError(emailField, "Bitte deine E-Mail-Adresse eingeben.");
      hasError = true;
    } else if (!EMAIL_REGEX.test(email)) {
      if (emailField) setFieldError(emailField, "Die E-Mail-Adresse scheint ungültig zu sein.");
      hasError = true;
    }

    if (!message) {
      if (msgField) setFieldError(msgField, "Bitte dein Anliegen kurz beschreiben.");
      hasError = true;
    }

    if (hasError) {
      showToast("Bitte alle Pflichtfelder ausfüllen.", { type: "error" });
      // Ersten Fehler fokussieren
      const firstInvalid = contactForm.querySelector("[aria-invalid]");
      firstInvalid?.focus();
      return;
    }

    // ── Mailto zusammenbauen ─────────────────────────────────────────────────
    const subject = encodeURIComponent(`Projektanfrage von ${name}`);
    const body = encodeURIComponent(
      [
        `Name: ${name}`,
        `E-Mail: ${email}`,
        `Telefon: ${phone || "-"}`,
        `Firma: ${company || "-"}`,
        "",
        `Projektkompass: ${projectLine || "-"}`,
        "",
        "Projektbeschreibung:",
        message,
      ].join("\n"),
    );

    try {
      window.location.href = `mailto:hello@buildit.studio?subject=${subject}&body=${body}`;
      showToast("E-Mail-Client wird geöffnet …", { type: "info", duration: 4000 });
    } catch {
      showToast(
        "E-Mail-Client konnte nicht geöffnet werden. Bitte schreib uns direkt an hello@buildit.studio.",
        { type: "error", duration: 0 },
      );
    }
  });
}
