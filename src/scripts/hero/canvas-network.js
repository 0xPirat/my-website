const HEX_START_ANGLE = -Math.PI / 2;
const HEX_SIDES = 6;
const HEX_VERTICAL_SCALE = 0.92;

function buildHexVertices(centerX, centerY, radius) {
  return Array.from({ length: HEX_SIDES }, (_, index) => ({
    x: centerX + Math.cos(HEX_START_ANGLE + (Math.PI * 2 * index) / HEX_SIDES) * radius,
    y:
      centerY +
      Math.sin(HEX_START_ANGLE + (Math.PI * 2 * index) / HEX_SIDES) *
        radius *
        HEX_VERTICAL_SCALE,
  }));
}

function tracePolygon(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index].x, points[index].y);
  }

  ctx.closePath();
}

function drawBand(ctx, points, gradientStops) {
  const gradient = ctx.createLinearGradient(
    gradientStops.x1,
    gradientStops.y1,
    gradientStops.x2,
    gradientStops.y2
  );

  gradientStops.stops.forEach(({ offset, color }) => {
    gradient.addColorStop(offset, color);
  });

  tracePolygon(ctx, points);
  ctx.fillStyle = gradient;
  ctx.fill();
}

function getHexPoint(centerX, centerY, radius, progress) {
  const vertices = buildHexVertices(centerX, centerY, radius);
  const normalized = ((progress % 1) + 1) % 1;
  const segment = normalized * HEX_SIDES;
  const index = Math.floor(segment);
  const localProgress = segment - index;
  const start = vertices[index];
  const end = vertices[(index + 1) % HEX_SIDES];

  return {
    x: start.x + (end.x - start.x) * localProgress,
    y: start.y + (end.y - start.y) * localProgress,
  };
}

export function initHeroCanvas({ reduceMotion }) {
  const heroCanvas = document.getElementById("hero-canvas");

  if (!heroCanvas || reduceMotion) {
    return;
  }

  const ctx = heroCanvas.getContext("2d");

  if (!ctx) {
    return;
  }

  const particles = Array.from({ length: 24 }, (_, index) => ({
    progress: index / 24,
    ringScale: 0.46 + (index % 3) * 0.16,
    speed: 0.0009 + (index % 5) * 0.00017,
    size: 1.45 + (index % 4) * 0.48,
    wobble: 0.015 + (index % 4) * 0.004,
    phase: (index % 6) * 0.28,
  }));

  let width = 0;
  let height = 0;
  let dpr = 1;
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

  const drawField = () => {
    ctx.strokeStyle = "rgba(171, 181, 255, 0.05)";
    ctx.lineWidth = 1;

    for (let x = -height; x <= width + height; x += 56) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x + height, 0);
      ctx.stroke();
    }
  };

  const drawStructure = (centerX, centerY, baseRadius) => {
    const outer = buildHexVertices(centerX, centerY, baseRadius);
    const middle = buildHexVertices(centerX, centerY, baseRadius * 0.69);
    const inner = buildHexVertices(centerX, centerY, baseRadius * 0.34);
    const shellGradient = ctx.createLinearGradient(
      centerX - baseRadius,
      centerY - baseRadius,
      centerX + baseRadius,
      centerY + baseRadius
    );

    shellGradient.addColorStop(0, "rgba(103, 89, 255, 0.16)");
    shellGradient.addColorStop(0.5, "rgba(168, 142, 255, 0.1)");
    shellGradient.addColorStop(1, "rgba(223, 229, 255, 0.04)");

    tracePolygon(ctx, outer);
    ctx.fillStyle = shellGradient;
    ctx.fill();

    drawBand(ctx, [outer[5], outer[1], middle[1], middle[5]], {
      x1: centerX - baseRadius * 0.68,
      y1: centerY - baseRadius * 0.8,
      x2: centerX + baseRadius * 0.78,
      y2: centerY - baseRadius * 0.12,
      stops: [
        { offset: 0, color: "rgba(112, 99, 255, 0.44)" },
        { offset: 0.58, color: "rgba(182, 160, 255, 0.32)" },
        { offset: 1, color: "rgba(223, 229, 255, 0.2)" },
      ],
    });

    drawBand(ctx, [outer[1], outer[3], middle[3], middle[1]], {
      x1: centerX + baseRadius * 0.16,
      y1: centerY - baseRadius * 0.5,
      x2: centerX + baseRadius * 0.7,
      y2: centerY + baseRadius * 0.88,
      stops: [
        { offset: 0, color: "rgba(216, 223, 255, 0.3)" },
        { offset: 0.52, color: "rgba(161, 171, 255, 0.28)" },
        { offset: 1, color: "rgba(118, 108, 255, 0.24)" },
      ],
    });

    drawBand(ctx, [outer[4], outer[0], middle[0], middle[4]], {
      x1: centerX - baseRadius * 0.72,
      y1: centerY + baseRadius * 0.62,
      x2: centerX - baseRadius * 0.1,
      y2: centerY - baseRadius * 0.42,
      stops: [
        { offset: 0, color: "rgba(86, 76, 220, 0.34)" },
        { offset: 0.6, color: "rgba(123, 113, 255, 0.3)" },
        { offset: 1, color: "rgba(212, 218, 255, 0.18)" },
      ],
    });

    tracePolygon(ctx, middle);
    ctx.strokeStyle = "rgba(214, 220, 255, 0.16)";
    ctx.lineWidth = 1;
    ctx.stroke();

    tracePolygon(ctx, inner);
    ctx.fillStyle = "rgba(5, 8, 24, 0.55)";
    ctx.fill();
    ctx.strokeStyle = "rgba(214, 220, 255, 0.12)";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(middle[5].x, middle[5].y);
    ctx.lineTo(middle[2].x, middle[2].y);
    ctx.moveTo(middle[4].x, middle[4].y);
    ctx.lineTo(middle[1].x, middle[1].y);
    ctx.moveTo(middle[0].x, middle[0].y);
    ctx.lineTo(middle[3].x, middle[3].y);
    ctx.strokeStyle = "rgba(214, 220, 255, 0.08)";
    ctx.stroke();
  };

  const draw = (now) => {
    ctx.clearRect(0, 0, width, height);
    drawField();

    const centerX = width * 0.52;
    const centerY = height * 0.46;
    const baseRadius = Math.min(width, height) * 0.34;
    const glow = ctx.createRadialGradient(
      centerX,
      centerY,
      baseRadius * 0.08,
      centerX,
      centerY,
      baseRadius * 1.34
    );

    glow.addColorStop(0, "rgba(190, 177, 255, 0.18)");
    glow.addColorStop(0.55, "rgba(111, 99, 255, 0.12)");
    glow.addColorStop(1, "rgba(111, 99, 255, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    drawStructure(centerX, centerY, baseRadius);

    const positions = particles.map((particle, index) => {
      const progress = particle.progress + now * particle.speed;
      const wobble = 1 + Math.sin(now * particle.speed * 6 + particle.phase) * particle.wobble;
      const ringRadius = baseRadius * particle.ringScale * wobble;
      const point = getHexPoint(centerX, centerY, ringRadius, progress);

      return { ...particle, index, x: point.x, y: point.y };
    });

    positions.forEach((particle) => {
      positions.forEach((other) => {
        if (other.index <= particle.index) {
          return;
        }

        const distance = Math.hypot(particle.x - other.x, particle.y - other.y);

        if (distance > 128) {
          return;
        }

        const alpha = 1 - distance / 128;
        ctx.strokeStyle = `rgba(188, 196, 255, ${alpha * 0.16})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
      });
    });

    positions.forEach((particle) => {
      ctx.beginPath();
      ctx.fillStyle = "rgba(223, 229, 255, 0.86)";
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = "rgba(111, 99, 255, 0.18)";
      ctx.arc(particle.x, particle.y, particle.size * 4.6, 0, Math.PI * 2);
      ctx.fill();
    });

    animationId = window.requestAnimationFrame(draw);
  };

  resize();
  animationId = window.requestAnimationFrame(draw);

  window.addEventListener("resize", resize);
  window.addEventListener("beforeunload", () => {
    window.cancelAnimationFrame(animationId);
  });
}
