export function initMetrics({ reduceMotion }) {
  const metricValues = document.querySelectorAll(".metric-value[data-count]");

  if (!metricValues.length) {
    return;
  }

  const formatMetric = (value, suffix) => `${value}${suffix || ""}`;

  const animateMetric = (element) => {
    const target = Number(element.dataset.count || 0);
    const suffix = element.dataset.suffix || "";

    if (!target || reduceMotion) {
      element.textContent = formatMetric(target, suffix);
      return;
    }

    const duration = 1200;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      element.textContent = formatMetric(current, suffix);

      if (progress < 1) {
        window.requestAnimationFrame(tick);
      }
    };

    window.requestAnimationFrame(tick);
  };

  const metricObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        animateMetric(entry.target);
        metricObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );

  metricValues.forEach((metric) => metricObserver.observe(metric));
}
