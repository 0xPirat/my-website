const yearTarget = document.getElementById("year");
const revealElements = document.querySelectorAll("[data-reveal]");
const navToggle = document.querySelector(".nav-toggle");
const navPanel = document.getElementById("site-nav");
const navLinks = navPanel ? navPanel.querySelectorAll("a") : [];
const heroCanvas = document.getElementById("hero-canvas");
const estimator = document.querySelector("[data-estimator]");
const estimatePrice = document.getElementById("estimate-price");
const estimateWeeks = document.getElementById("estimate-weeks");
const estimateSummary = document.getElementById("estimate-summary");
const estimateFeatures = document.getElementById("estimate-features");
const estimateSelection = document.getElementById("estimate-selection");
const contactForm = document.querySelector(".contact-form");
const metricValues = document.querySelectorAll(".metric-value[data-count]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (yearTarget) {
  yearTarget.textContent = String(new Date().getFullYear());
}

if (navToggle && navPanel) {
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

if (revealElements.length && !reduceMotion) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.16 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("visible"));
}

if (metricValues.length) {
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
        if (!entry.isIntersecting) return;
        animateMetric(entry.target);
        metricObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );

  metricValues.forEach((metric) => metricObserver.observe(metric));
}

if (estimator && estimatePrice && estimateWeeks && estimateSummary && estimateFeatures) {
  const groups = estimator.querySelectorAll(".choice-group");
  const euro = new Intl.NumberFormat("de-DE");

  const renderEstimate = () => {
    let totalPrice = 0;
    let totalWeeks = 0;
    const labels = [];
    const features = [];

    groups.forEach((group) => {
      const active = group.querySelector(".choice-button.is-active");
      if (!active) return;

      totalPrice += Number(active.dataset.price || 0);
      totalWeeks += Number(active.dataset.weeks || 0);
      labels.push(active.dataset.label || active.textContent.trim());

      const itemFeatures = (active.dataset.features || "")
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean);
      features.push(...itemFeatures);
    });

    const safeWeeks = Math.max(1, totalWeeks);
    const summary = `${labels.join(" / ")}.`;

    estimatePrice.textContent = `${euro.format(totalPrice)} EUR`;
    estimateWeeks.textContent = `${safeWeeks} ${safeWeeks === 1 ? "Woche" : "Wochen"}`;
    estimateSummary.textContent = summary;
    estimateSelection.value = summary;

    estimateFeatures.innerHTML = "";
    features.slice(0, 5).forEach((feature) => {
      const li = document.createElement("li");
      li.textContent = feature;
      estimateFeatures.appendChild(li);
    });
  };

  groups.forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest(".choice-button");
      if (!button) return;

      group.querySelectorAll(".choice-button").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      renderEstimate();
    });
  });

  renderEstimate();
}

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const name = (formData.get("name") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();
    const company = (formData.get("company") || "").toString().trim();
    const message = (formData.get("message") || "").toString().trim();
    const projectLine = (formData.get("estimateSelection") || "").toString().trim();
    const subject = encodeURIComponent(`Projektanfrage von ${name || "Website"}`);
    const body = encodeURIComponent(
      [
        `Name: ${name}`,
        `E-Mail: ${email}`,
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

if (heroCanvas && !reduceMotion) {
  const ctx = heroCanvas.getContext("2d");

  if (ctx) {
    const particles = Array.from({ length: 22 }, (_, index) => ({
      angle: (Math.PI * 2 * index) / 22,
      radius: 0.22 + (index % 6) * 0.06,
      speed: 0.0014 + (index % 5) * 0.0003,
      size: 1.2 + (index % 4) * 0.55,
    }));

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let animationId = 0;

    const resize = () => {
      const bounds = heroCanvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(bounds.width));
      height = Math.max(1, Math.floor(bounds.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      heroCanvas.width = Math.floor(width * dpr);
      heroCanvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawGrid = () => {
      ctx.strokeStyle = "rgba(167, 207, 232, 0.06)";
      ctx.lineWidth = 1;

      for (let x = 0; x <= width; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y <= height; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    };

    const draw = () => {
      frame += 1;
      ctx.clearRect(0, 0, width, height);
      drawGrid();

      const centerX = width * 0.52;
      const centerY = height * 0.44;
      const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.38);
      glow.addColorStop(0, "rgba(118, 247, 208, 0.18)");
      glow.addColorStop(1, "rgba(118, 247, 208, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      const positions = particles.map((particle, index) => {
        const drift = frame * particle.speed * 4;
        const x = centerX + Math.cos(particle.angle + drift) * width * particle.radius;
        const y = centerY + Math.sin(particle.angle * 1.2 + drift) * height * (particle.radius * 0.7);
        return { ...particle, index, x, y };
      });

      positions.forEach((particle) => {
        positions.forEach((other) => {
          if (other.index <= particle.index) return;
          const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
          if (distance > 150) return;

          const alpha = 1 - distance / 150;
          ctx.strokeStyle = `rgba(118, 247, 208, ${alpha * 0.18})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        });
      });

      positions.forEach((particle) => {
        ctx.beginPath();
        ctx.fillStyle = "rgba(118, 247, 208, 0.92)";
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = "rgba(255, 201, 120, 0.12)";
        ctx.arc(particle.x, particle.y, particle.size * 4.8, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("beforeunload", () => window.cancelAnimationFrame(animationId));
  }
}
