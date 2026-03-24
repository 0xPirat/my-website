function isFinePointerDevice() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function initServiceChipPopovers() {
  const chips = Array.from(document.querySelectorAll("[data-service-chip]"));

  if (!chips.length) {
    return;
  }

  const references = new Map(
    chips.map((chip) => [
      chip,
      {
        trigger: chip.querySelector("[data-service-chip-trigger]"),
        popover: chip.querySelector("[data-service-chip-popover]"),
      },
    ]),
  );

  const setOpenState = (chip, isOpen) => {
    const ref = references.get(chip);

    if (!ref?.trigger || !ref.popover) {
      return;
    }

    chip.dataset.open = isOpen ? "true" : "false";
    ref.trigger.setAttribute("aria-expanded", String(isOpen));
    ref.popover.setAttribute("aria-hidden", String(!isOpen));
  };

  const closeAll = (exceptChip = null) => {
    chips.forEach((chip) => {
      if (chip !== exceptChip) {
        setOpenState(chip, false);
      }
    });
  };

  chips.forEach((chip) => {
    const ref = references.get(chip);

    if (!ref?.trigger || !ref.popover) {
      return;
    }

    setOpenState(chip, false);

    chip.addEventListener("pointerenter", () => {
      if (!isFinePointerDevice()) {
        return;
      }

      closeAll(chip);
      setOpenState(chip, true);
    });

    chip.addEventListener("pointerleave", () => {
      if (!isFinePointerDevice() || chip.contains(document.activeElement)) {
        return;
      }

      setOpenState(chip, false);
    });

    chip.addEventListener("focusin", () => {
      if (!isFinePointerDevice() && !ref.trigger.matches(":focus-visible")) {
        return;
      }

      closeAll(chip);
      setOpenState(chip, true);
    });

    chip.addEventListener("focusout", () => {
      window.setTimeout(() => {
        if (chip.contains(document.activeElement)) {
          return;
        }

        if (isFinePointerDevice() && chip.matches(":hover")) {
          return;
        }

        setOpenState(chip, false);
      }, 0);
    });

    ref.trigger.addEventListener("click", (event) => {
      if (isFinePointerDevice()) {
        setOpenState(chip, true);
        return;
      }

      event.preventDefault();

      const nextOpen = chip.dataset.open !== "true";
      closeAll(nextOpen ? chip : null);
      setOpenState(chip, nextOpen);
    });
  });

  document.addEventListener("pointerdown", (event) => {
    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    if (chips.some((chip) => chip.contains(target))) {
      return;
    }

    closeAll();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    closeAll();

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });
}
