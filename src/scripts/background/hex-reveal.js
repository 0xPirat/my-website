const REVEAL_DURATION = 7000;
const HOTSPOT_INTERVAL = 72;
const HOTSPOT_DISTANCE = 18;
const MAX_HOTSPOTS = 28;
const SIDES = [6, 6, 6, 8, 8, 9, 10, 11];
const PALETTES = [
  {
    shellA: "rgba(58, 82, 210, 0.98)",
    shellB: "rgba(112, 98, 255, 0.84)",
    shellC: "rgba(217, 225, 255, 0.54)",
    bandA: "rgba(189, 203, 255, 0.46)",
    bandB: "rgba(106, 122, 255, 0.42)",
    core: "rgba(4, 7, 20, 0.9)",
    edge: "rgba(220, 228, 255, 0.52)",
    line: "rgba(194, 205, 255, 0.26)",
    glow: "rgba(96, 112, 255, 0.2)",
  },
  {
    shellA: "rgba(72, 56, 205, 0.98)",
    shellB: "rgba(136, 112, 255, 0.8)",
    shellC: "rgba(226, 231, 255, 0.5)",
    bandA: "rgba(213, 222, 255, 0.42)",
    bandB: "rgba(145, 130, 255, 0.38)",
    core: "rgba(6, 8, 22, 0.9)",
    edge: "rgba(230, 235, 255, 0.48)",
    line: "rgba(204, 211, 255, 0.24)",
    glow: "rgba(124, 104, 255, 0.18)",
  },
  {
    shellA: "rgba(40, 116, 226, 0.96)",
    shellB: "rgba(92, 154, 255, 0.74)",
    shellC: "rgba(215, 229, 255, 0.44)",
    bandA: "rgba(205, 231, 255, 0.38)",
    bandB: "rgba(104, 182, 255, 0.34)",
    core: "rgba(3, 8, 19, 0.92)",
    edge: "rgba(214, 234, 255, 0.46)",
    line: "rgba(186, 223, 255, 0.22)",
    glow: "rgba(72, 152, 255, 0.18)",
  },
];

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function smoothstep(edge0, edge1, value) {
  const progress = clamp((value - edge0) / (edge1 - edge0 || 1));

  return progress * progress * (3 - 2 * progress);
}

function hash2d(x, y, seed = 0) {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;

  return value - Math.floor(value);
}

function tracePolygon(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index].x, points[index].y);
  }

  ctx.closePath();
}

function insetPolygon(points, centerX, centerY, scale) {
  return points.map((point) => ({
    x: lerp(centerX, point.x, scale),
    y: lerp(centerY, point.y, scale),
  }));
}

function buildPolygonPoints(cell, centerX, centerY, radius, rotation, time) {
  return Array.from({ length: cell.sides }, (_, index) => {
    const angle = rotation + (Math.PI * 2 * index) / cell.sides;
    const ripple =
      0.88 +
      Math.sin(index * 1.37 + cell.phase + time * 0.00018) * 0.08 +
      (index % 2 === 0 ? cell.chamfer : -cell.chamfer) * 0.08;
    const localRadius = radius * ripple;

    return {
      x: centerX + Math.cos(angle) * localRadius * cell.stretchX,
      y: centerY + Math.sin(angle) * localRadius * cell.stretchY,
    };
  });
}

function drawBand(ctx, points, x1, y1, x2, y2, colorA, colorB) {
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);

  gradient.addColorStop(0, colorA);
  gradient.addColorStop(1, colorB);

  tracePolygon(ctx, points);
  ctx.fillStyle = gradient;
  ctx.fill();
}

function createCells(width, height) {
  const cells = [];
  const step = clamp(Math.min(width, height) * 0.088, 72, 98);
  const stepX = step;
  const stepY = step * 0.82;
  const columnCount = Math.ceil(width / stepX) + 4;
  const rowCount = Math.ceil(height / stepY) + 4;

  for (let row = -2; row < rowCount; row += 1) {
    const rowOffset = row % 2 === 0 ? 0 : stepX * 0.5;

    for (let column = -2; column < columnCount; column += 1) {
      const densitySeed = hash2d(column, row, 1);

      if (densitySeed < 0.14) {
        continue;
      }

      const jitterX = (hash2d(column, row, 2) - 0.5) * stepX * 0.28;
      const jitterY = (hash2d(column, row, 3) - 0.5) * stepY * 0.28;
      const baseX = column * stepX + rowOffset + stepX * 0.5 + jitterX;
      const baseY = row * stepY + stepY * 0.5 + jitterY;
      const paletteIndex = Math.floor(hash2d(column, row, 4) * PALETTES.length) % PALETTES.length;
      const sides = SIDES[Math.floor(hash2d(column, row, 5) * SIDES.length) % SIDES.length];

      cells.push({
        x: baseX,
        y: baseY,
        radius: step * (0.28 + hash2d(column, row, 6) * 0.18),
        sides,
        paletteIndex,
        stretchX: 0.9 + hash2d(column, row, 7) * 0.34,
        stretchY: 0.84 + hash2d(column, row, 8) * 0.22,
        innerScale: 0.56 + hash2d(column, row, 9) * 0.1,
        chamfer: 0.3 + hash2d(column, row, 10) * 0.7,
        rotation: hash2d(column, row, 11) * Math.PI,
        phase: hash2d(column, row, 12) * Math.PI * 2,
        driftX: 3 + hash2d(column, row, 13) * 8,
        driftY: 2 + hash2d(column, row, 14) * 6,
        depth: 0.16 + hash2d(column, row, 15) * 0.84,
        opacity: 0.62 + hash2d(column, row, 16) * 0.34,
        staticReveal: 0.08 + hash2d(column, row, 17) * 0.1,
      });
    }
  }

  return cells;
}

function computeReveal(cellX, cellY, hotspots, now, radius, staticField = 0) {
  let reveal = staticField;

  for (let index = hotspots.length - 1; index >= 0; index -= 1) {
    const hotspot = hotspots[index];
    const age = now - hotspot.time;

    if (age >= REVEAL_DURATION) {
      continue;
    }

    const distance = Math.hypot(cellX - hotspot.x, cellY - hotspot.y);

    if (distance >= radius) {
      continue;
    }

    const distanceStrength = 1 - distance / radius;
    const radialStrength = smoothstep(0, 1, distanceStrength);
    const fadeStrength = 1 - age / REVEAL_DURATION;
    const revealStrength = radialStrength * fadeStrength * fadeStrength * hotspot.intensity;

    if (revealStrength > reveal) {
      reveal = revealStrength;
    }

    if (reveal >= 1) {
      break;
    }
  }

  return clamp(reveal, 0, 1);
}

function drawCell(ctx, cell, centerX, centerY, radius, reveal, time) {
  const palette = PALETTES[cell.paletteIndex];
  const rotation = cell.rotation + Math.sin(time * 0.00016 + cell.phase) * 0.08;
  const points = buildPolygonPoints(cell, centerX, centerY, radius, rotation, time);
  const inner = insetPolygon(points, centerX, centerY, cell.innerScale);
  const core = insetPolygon(points, centerX, centerY, 0.34);
  const bandIndex = Math.max(2, Math.floor(cell.sides * 0.34));
  const lowerIndex = Math.max(bandIndex + 1, Math.floor(cell.sides * 0.68));
  const lineStart = inner[0];
  const lineEnd = inner[Math.floor(cell.sides * 0.5) % cell.sides];
  const shellGradient = ctx.createLinearGradient(
    centerX - radius * 1.2,
    centerY - radius,
    centerX + radius * 1.12,
    centerY + radius
  );

  shellGradient.addColorStop(0, palette.shellA);
  shellGradient.addColorStop(0.52, palette.shellB);
  shellGradient.addColorStop(1, palette.shellC);

  ctx.save();
  ctx.globalAlpha = reveal * cell.opacity;

  // Glow als radialer Gradient statt ctx.shadowBlur — shadowBlur erzwingt einen
  // teuren Blur-Pass pro Zelle auf der GPU. Ein einfacher radialer Gradient
  // sieht nahezu gleich aus, ist aber nur eine normale fill-Operation.
  const glowRadius = radius * (1.5 + reveal * 0.7);
  const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
  glowGradient.addColorStop(0, palette.glow);
  glowGradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  tracePolygon(ctx, points);
  ctx.fillStyle = shellGradient;
  ctx.fill();

  drawBand(
    ctx,
    [points[0], points[1], inner[1], inner[0]],
    centerX - radius,
    centerY - radius,
    centerX + radius,
    centerY - radius * 0.1,
    palette.bandA,
    "rgba(255, 255, 255, 0)"
  );

  drawBand(
    ctx,
    [points[1], points[bandIndex], inner[bandIndex], inner[1]],
    centerX,
    centerY - radius,
    centerX + radius,
    centerY + radius,
    "rgba(255, 255, 255, 0.02)",
    palette.bandB
  );

  drawBand(
    ctx,
    [points[lowerIndex], points[(lowerIndex + 1) % cell.sides], inner[(lowerIndex + 1) % cell.sides], inner[lowerIndex]],
    centerX - radius * 0.8,
    centerY + radius,
    centerX,
    centerY,
    "rgba(255, 255, 255, 0)",
    palette.bandB
  );

  tracePolygon(ctx, inner);
  ctx.fillStyle = palette.core;
  ctx.fill();

  tracePolygon(ctx, points);
  ctx.lineWidth = 1;
  ctx.strokeStyle = palette.edge;
  ctx.stroke();

  tracePolygon(ctx, inner);
  ctx.strokeStyle = palette.line;
  ctx.stroke();

  tracePolygon(ctx, core);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(lineStart.x, lineStart.y);
  ctx.lineTo(lineEnd.x, lineEnd.y);
  ctx.strokeStyle = palette.line;
  ctx.stroke();

  ctx.restore();
}

function addHotspot(state, x, y, now, intensity = 1) {
  state.hotspots.push({
    x,
    y,
    time: now,
    intensity,
  });

  if (state.hotspots.length > MAX_HOTSPOTS) {
    state.hotspots.splice(0, state.hotspots.length - MAX_HOTSPOTS);
  }

  state.lastHotspotTime = now;
  state.lastHotspotX = x;
  state.lastHotspotY = y;
}

export function initHexRevealBackground({ reduceMotion }) {
  if (reduceMotion) {
    return;
  }

  const root = document.querySelector(".site-bg");

  if (!root) {
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.className = "site-bg-canvas";
  canvas.setAttribute("aria-hidden", "true");
  root.prepend(canvas);

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    canvas.remove();
    return;
  }

  root.classList.add("is-enhanced");

  const prefersFinePointer = window.matchMedia("(pointer: fine)").matches;
  const state = {
    width: 0,
    height: 0,
    dpr: 1,
    cells: [],
    hotspots: [],
    active: false,
    interactive: prefersFinePointer,
    pointerX: window.innerWidth * 0.5,
    pointerY: window.innerHeight * 0.45,
    targetX: window.innerWidth * 0.5,
    targetY: window.innerHeight * 0.45,
    lastHotspotX: Number.NaN,
    lastHotspotY: Number.NaN,
    lastHotspotTime: 0,
    frameId: 0,
    revealRadius: 220,
  };

  const scheduleFrame = () => {
    if (state.frameId) {
      return;
    }

    state.frameId = window.requestAnimationFrame(drawFrame);
  };

  const drawFrame = (time = performance.now()) => {
    state.frameId = 0;

    state.pointerX = lerp(state.pointerX, state.targetX, state.interactive ? 0.14 : 0.06);
    state.pointerY = lerp(state.pointerY, state.targetY, state.interactive ? 0.14 : 0.06);

    if (state.interactive && state.active) {
      const distanceSinceLast = Math.hypot(
        state.targetX - state.lastHotspotX,
        state.targetY - state.lastHotspotY
      );

      if (
        time - state.lastHotspotTime >= HOTSPOT_INTERVAL ||
        !Number.isFinite(distanceSinceLast) ||
        distanceSinceLast >= HOTSPOT_DISTANCE
      ) {
        addHotspot(state, state.targetX, state.targetY, time);
      }
    }

    state.hotspots = state.hotspots.filter((hotspot) => time - hotspot.time < REVEAL_DURATION);

    ctx.clearRect(0, 0, state.width, state.height);
    ctx.fillStyle = "#020307";
    ctx.fillRect(0, 0, state.width, state.height);

    const pointerNormX = state.width > 0 ? state.pointerX / state.width - 0.5 : 0;
    const pointerNormY = state.height > 0 ? state.pointerY / state.height - 0.5 : 0;
    const focusHotspot = state.hotspots[state.hotspots.length - 1];

    if (focusHotspot) {
      const glow = ctx.createRadialGradient(
        focusHotspot.x,
        focusHotspot.y,
        state.revealRadius * 0.08,
        focusHotspot.x,
        focusHotspot.y,
        state.revealRadius
      );

      glow.addColorStop(0, "rgba(110, 100, 255, 0.1)");
      glow.addColorStop(0.45, "rgba(79, 104, 255, 0.05)");
      glow.addColorStop(1, "rgba(2, 3, 7, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, state.width, state.height);
    }

    state.cells.forEach((cell) => {
      const offsetX =
        Math.sin(time * 0.00034 + cell.phase) * cell.driftX +
        pointerNormX * cell.depth * 22;
      const offsetY =
        Math.cos(time * 0.00028 + cell.phase * 1.2) * cell.driftY +
        pointerNormY * cell.depth * 16;
      const centerX = cell.x + offsetX;
      const centerY = cell.y + offsetY;
      const radius =
        cell.radius * (1 + Math.sin(time * 0.00042 + cell.phase) * 0.035);
      const reveal = computeReveal(
        centerX,
        centerY,
        state.hotspots,
        time,
        state.revealRadius,
        state.interactive ? 0 : cell.staticReveal
      );

      if (reveal < 0.04) {
        return;
      }

      drawCell(ctx, cell, centerX, centerY, radius, reveal, time);
    });

    if (state.interactive && (state.active || state.hotspots.length > 0)) {
      scheduleFrame();
    }
  };

  const resize = () => {
    const bounds = root.getBoundingClientRect();
    const width = Math.max(1, Math.floor(bounds.width));
    const height = Math.max(1, Math.floor(bounds.height));

    state.width = width;
    state.height = height;
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * state.dpr);
    canvas.height = Math.floor(height * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    state.cells = createCells(width, height);
    state.revealRadius = clamp(Math.min(width, height) * 0.2, 160, 260);

    if (!state.interactive) {
      drawFrame(performance.now());
      return;
    }

    if (state.active || state.hotspots.length > 0) {
      scheduleFrame();
    }
  };

  const handlePointerMove = (event) => {
    if (!state.interactive) {
      return;
    }

    state.active = true;
    state.targetX = clamp(event.clientX, 0, state.width);
    state.targetY = clamp(event.clientY, 0, state.height);

    scheduleFrame();
  };

  const handlePointerLeave = () => {
    if (!state.interactive) {
      return;
    }

    state.active = false;
    state.targetX = state.width * 0.5;
    state.targetY = state.height * 0.45;
  };

  resize();

  if (state.interactive) {
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointercancel", handlePointerLeave, { passive: true });
    window.addEventListener("blur", handlePointerLeave);
    window.addEventListener("mouseout", (event) => {
      if (!event.relatedTarget) {
        handlePointerLeave();
      }
    });
    window.addEventListener("resize", resize, { passive: true });
    return;
  }

  window.addEventListener("resize", resize, { passive: true });
}
