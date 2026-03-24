import { gsap } from "../../../public/vendor/gsap/index.js";
import { ScrollTrigger } from "../../../public/vendor/gsap/ScrollTrigger.js";

gsap.registerPlugin(ScrollTrigger);

const DESKTOP_FLOW_QUERY = "(min-width: 960px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)";

function getHeaderOffset() {
  const header = document.querySelector("[data-scene-subpage-header]");
  const headerHeight = header?.getBoundingClientRect().height || 96;

  return Math.round(headerHeight + 14);
}

function getSnapPoints(triggers) {
  const maxScroll = ScrollTrigger.maxScroll(window) || 1;

  return triggers.map((trigger) => gsap.utils.clamp(0, 1, trigger.start / maxScroll));
}

export function initWarumWirSectionFlow({ reduceMotion = false } = {}) {
  if (typeof window === "undefined" || reduceMotion) {
    return () => {};
  }

  const page = document.body;

  if (!page?.classList.contains("is-scene-subpage--warum-wir")) {
    return () => {};
  }

  const root = document.documentElement;
  const sections = Array.from(document.querySelectorAll("[data-flow-section]"));

  if (sections.length < 2) {
    return () => {};
  }

  const mm = gsap.matchMedia();

  mm.add(DESKTOP_FLOW_QUERY, () => {
    root.classList.add("is-warum-layered");
    page.classList.add("is-warum-layered");

    const layerTriggers = [];
    let snapTrigger = null;

    const setActiveLayer = (activeIndex) => {
      sections.forEach((section, index) => {
        section.classList.toggle("is-layer-active", index === activeIndex);
        section.classList.toggle("is-layer-past", index < activeIndex);
        section.classList.toggle("is-layer-upcoming", index > activeIndex);
      });
    };

    sections.forEach((section, index) => {
      section.style.zIndex = String(index + 1);
    });

    sections.forEach((section, index) => {
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: () => `top top+=${getHeaderOffset()}`,
        end: () => `+=${Math.max(window.innerHeight * 0.92, section.offsetHeight)}`,
        pin: true,
        pinSpacing: false,
        scrub: false,
        invalidateOnRefresh: true,
        onEnter: () => setActiveLayer(index),
        onEnterBack: () => setActiveLayer(index),
      });

      layerTriggers.push(trigger);
    });

    snapTrigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      snap: {
        snapTo: (progress) => gsap.utils.snap(getSnapPoints(layerTriggers), progress),
        duration: { min: 0.2, max: 0.55 },
        delay: 0.06,
        ease: "power1.inOut",
      },
    });

    setActiveLayer(0);
    ScrollTrigger.refresh();

    return () => {
      snapTrigger?.kill();
      layerTriggers.forEach((trigger) => trigger.kill());

      sections.forEach((section) => {
        section.classList.remove("is-layer-active", "is-layer-past", "is-layer-upcoming");
        section.style.removeProperty("z-index");
      });

      root.classList.remove("is-warum-layered");
      page.classList.remove("is-warum-layered");
    };
  });

  return () => {
    mm.revert();
  };
}
