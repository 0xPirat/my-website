export function initContactForm() {
  const contactForm = document.querySelector(".contact-form");

  if (!contactForm) {
    return;
  }

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const name = (formData.get("name") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();
    const phone = (formData.get("phone") || "").toString().trim();
    const company = (formData.get("company") || "").toString().trim();
    const message = (formData.get("message") || "").toString().trim();
    const projectLine = (formData.get("estimateSelection") || "").toString().trim();
    const subject = encodeURIComponent(`Projektanfrage von ${name || "Website"}`);
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
      ].join("\n")
    );

    window.location.href = `mailto:hello@buildit.studio?subject=${subject}&body=${body}`;
  });
}
