export function initNav() {
  const navToggle = document.querySelector(".nav-toggle");
  const navPanel = document.getElementById("site-nav");

  if (!navToggle || !navPanel) {
    return;
  }

  const navLinks = navPanel.querySelectorAll("a");

  const setNavState = (open) => {
    document.body.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  };

  navToggle.addEventListener("click", () => {
    const nextState = navToggle.getAttribute("aria-expanded") !== "true";
    setNavState(nextState);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => setNavState(false));
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) {
      setNavState(false);
    }
  });
}
