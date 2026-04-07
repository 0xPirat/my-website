const VIDEO_URL = new URL("../../../pictures/elements/backgrounds_landingpage/morionbackground.mp4", import.meta.url).href;
const BG_WHITE = "#ffffff";
const STAMP_SPACING = 18;
const STAMP_MIN_INTERVAL_MS = 44;
const STAMP_HOLD_MS = 6120;
const STAMP_FADE_MS = 1980;
const DRAW_MARGIN = 220;
const ACTIVE_VIDEO_ALPHA = 0.4;
const ACTIVE_VIDEO_BRIGHTNESS = 1.12;
const ACTIVE_VIDEO_CONTRAST = 0.78;
const BASE_RADIUS = 31;
const RADIUS_GAIN = 19;
const BASE_AURA_RADIUS = 36;
const AURA_RADIUS_GAIN = 24;
const TRAIL_CORE_WIDTH = 34;
const TRAIL_AURA_WIDTH = 72;
const TRAIL_CORE_BLUR = 5;
const TRAIL_AURA_BLUR = 18;
const ACTIVE_MASK_BLUR = 4;
const MELT_MASK_BLUR = 24;

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function getStampAgeStrength(ageMs) {
  if (ageMs <= STAMP_HOLD_MS) {
    return 1;
  }

  const fadeProgress = clamp((ageMs - STAMP_HOLD_MS) / STAMP_FADE_MS);
  return 1 - fadeProgress * fadeProgress * (3 - 2 * fadeProgress);
}

function getStampFadeProgress(ageMs) {
  if (ageMs <= STAMP_HOLD_MS) {
    return 0;
  }

  return clamp((ageMs - STAMP_HOLD_MS) / STAMP_FADE_MS);
}

function isStampVisible(x, y, width, height) {
  return x >= -DRAW_MARGIN && x <= width + DRAW_MARGIN && y >= -DRAW_MARGIN && y <= height + DRAW_MARGIN;
}

export function initWarumWirFlow({ reduceMotion = false } = {}) {
  if (typeof window === "undefined") return () => {};

  const canvas = document.getElementById("warum-reveal-canvas");
  if (!canvas) return () => {};

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const maskCanvas = document.createElement("canvas");
  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) return () => {};

  let width = 0;
  let height = 0;
  let rawX = 0;
  let rawY = 0;
  let pointerInitialized = false;
  let frameId = 0;
  let disposed = false;
  let mediaReady = false;
  let lastStampPageX = Number.NaN;
  let lastStampPageY = Number.NaN;
  let lastStampTime = 0;

  const startedAt = performance.now();
  const trailStamps = [];
  const touchOptions = { passive: true };
  const pointerDownOptions = { passive: true };
  const scrollOptions = { passive: true };

  const video = document.createElement("video");
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = "auto";

  const resizeCanvas = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    maskCanvas.width = Math.round(width * dpr);
    maskCanvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    maskCtx.setTransform(1, 0, 0, 1, 0, 0);
    maskCtx.scale(dpr, dpr);

    if (!pointerInitialized) {
      rawX = width * 0.5;
      rawY = height * 0.5;
    }
  };

  const ensurePlayback = () => {
    if (disposed || video.ended) return;
    video.play().catch(() => {});
  };

  const markMediaReady = () => {
    mediaReady = video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    ensurePlayback();
  };

  const pushStamp = (pageX, pageY, createdAt, velocityX, velocityY) => {
    trailStamps.push({
      pageX,
      pageY,
      createdAt,
      seed: Math.random() * Math.PI * 2,
      wobbleSeed: Math.random() * 1000,
      velocityX,
      velocityY,
    });
  };

  const stampAlongPath = (pageX, pageY, velocityX, velocityY, force = false) => {
    const now = performance.now();
    const hasPreviousStamp = Number.isFinite(lastStampPageX) && Number.isFinite(lastStampPageY);
    const distance = hasPreviousStamp ? Math.hypot(pageX - lastStampPageX, pageY - lastStampPageY) : 0;
    const elapsed = now - lastStampTime;

    if (!force && hasPreviousStamp && distance < STAMP_SPACING && elapsed < STAMP_MIN_INTERVAL_MS) {
      return;
    }

    if (!hasPreviousStamp) {
      pushStamp(pageX, pageY, now, velocityX, velocityY);
      lastStampPageX = pageX;
      lastStampPageY = pageY;
      lastStampTime = now;
      return;
    }

    const stepCount = Math.max(1, Math.ceil(distance / STAMP_SPACING));
    const startX = lastStampPageX;
    const startY = lastStampPageY;

    for (let index = 1; index <= stepCount; index += 1) {
      const progress = index / stepCount;
      pushStamp(
        lerp(startX, pageX, progress),
        lerp(startY, pageY, progress),
        now - (stepCount - index) * 12,
        velocityX,
        velocityY,
      );
    }

    lastStampPageX = pageX;
    lastStampPageY = pageY;
    lastStampTime = now;
  };

  const setPointer = (clientX, clientY, forceStamp = false) => {
    const velocityX = pointerInitialized ? clientX - rawX : 0;
    const velocityY = pointerInitialized ? clientY - rawY : 0;

    rawX = clientX;
    rawY = clientY;
    pointerInitialized = true;

    stampAlongPath(
      clientX + window.scrollX,
      clientY + window.scrollY,
      velocityX,
      velocityY,
      forceStamp,
    );
  };

  const onMouseMove = (event) => {
    setPointer(event.clientX, event.clientY);
  };

  const onPointerDown = (event) => {
    ensurePlayback();

    if (typeof event.clientX === "number" && typeof event.clientY === "number") {
      setPointer(event.clientX, event.clientY, true);
    }
  };

  const onTouchMove = (event) => {
    const touch = event.touches[0];
    if (!touch) return;

    setPointer(touch.clientX, touch.clientY);
  };

  const onScroll = () => {
    if (!pointerInitialized) return;

    stampAlongPath(rawX + window.scrollX, rawY + window.scrollY, 0, 0, true);
  };

  video.addEventListener("loadeddata", markMediaReady);
  video.addEventListener("canplay", markMediaReady);
  video.addEventListener("playing", () => {
    mediaReady = true;
  });
  video.addEventListener("error", () => {
    console.warn("[warum-reveal] Video konnte nicht geladen werden:", VIDEO_URL);
  });
  video.src = VIDEO_URL;
  video.load();
  ensurePlayback();

  const drawCoverVideo = (offsetX = 0, offsetY = 0) => {
    if (!mediaReady || video.videoWidth === 0 || video.videoHeight === 0) return;

    const mediaWidth = video.videoWidth;
    const mediaHeight = video.videoHeight;
    const scale = Math.max(width / mediaWidth, height / mediaHeight);
    const drawWidth = mediaWidth * scale;
    const drawHeight = mediaHeight * scale;
    const drawX = (width - drawWidth) / 2 + offsetX;
    const drawY = (height - drawHeight) / 2 + offsetY;

    ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
  };

  const drawBlobAura = (targetCtx, { x, y, radius, alpha, stretchX, stretchY, rotation }) => {
    targetCtx.save();
    targetCtx.translate(x, y);
    targetCtx.rotate(rotation);
    targetCtx.scale(stretchX, stretchY);

    const gradient = targetCtx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
    gradient.addColorStop(0.42, `rgba(0, 0, 0, ${alpha * 0.86})`);
    gradient.addColorStop(0.78, `rgba(0, 0, 0, ${alpha * 0.28})`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    targetCtx.fillStyle = gradient;
    targetCtx.beginPath();
    targetCtx.arc(0, 0, radius, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.restore();
  };

  const buildBlobPath = (targetCtx, stamp, time, strength) => {
    const pointCount = 30;
    const flow = reduceMotion ? stamp.seed : time * 1.74 + stamp.seed;
    const baseRadius = BASE_RADIUS + strength * RADIUS_GAIN;
    const centerX = stamp.x + (reduceMotion ? 0 : Math.sin(flow * 0.64 + stamp.wobbleSeed) * 2.6);
    const centerY = stamp.y + (reduceMotion ? 0 : Math.cos(flow * 0.58 + stamp.wobbleSeed) * 2.1);
    const velocityNormX = width > 0 ? clamp(stamp.velocityX / 48, -1, 1) : 0;
    const velocityNormY = height > 0 ? clamp(stamp.velocityY / 48, -1, 1) : 0;
    const skewX = reduceMotion ? 0 : Math.sin(flow * 0.52 + stamp.seed * 2.1) * 0.12;
    const skewY = reduceMotion ? 0 : Math.cos(flow * 0.46 + stamp.seed * 1.6) * 0.1;

    targetCtx.beginPath();

    for (let index = 0; index <= pointCount; index += 1) {
      const ratio = index / pointCount;
      const angle = ratio * Math.PI * 2;
      const dentA = Math.sin(angle * 2 + flow * 0.72) * 0.08;
      const dentB = Math.sin(angle * 3 - flow * 0.94 + stamp.seed * 1.4) * 0.1;
      const dentC = Math.cos(angle * 5 + flow * 1.18 + stamp.seed * 0.35) * 0.085;
      const dentD = Math.sin(angle * 7 - flow * 1.46 + stamp.seed * 2.1) * 0.06;
      const dentE = Math.cos(angle * 9 + flow * 1.62 + stamp.seed * 0.8) * 0.045;
      const pulse = reduceMotion ? 0 : Math.sin(flow * 1.08 + angle * 1.8) * 0.04;
      const forwardBulge = velocityNormX * Math.cos(angle) * 0.34 + velocityNormY * Math.sin(angle) * 0.32;
      const sideDent = (velocityNormX * Math.sin(angle) - velocityNormY * Math.cos(angle)) * 0.16;
      const localRadius = baseRadius * (1 + dentA + dentB + dentC + dentD + dentE + pulse + forwardBulge - sideDent);
      const offsetX = Math.cos(angle) * localRadius * (1 + skewX) + Math.sin(angle * 2.4 + flow) * baseRadius * 0.05;
      const offsetY = Math.sin(angle) * localRadius * (1 + skewY) + Math.cos(angle * 1.8 - flow) * baseRadius * 0.045;
      const x = centerX + offsetX;
      const y = centerY + offsetY;

      if (index === 0) {
        targetCtx.moveTo(x, y);
      } else {
        targetCtx.lineTo(x, y);
      }
    }

    targetCtx.closePath();
  };

  const drawTrailSegment = (targetCtx, startStamp, endStamp, strength, meltProgress) => {
    const distance = Math.hypot(endStamp.x - startStamp.x, endStamp.y - startStamp.y);
    if (distance < 0.5) return;

    const auraBlur = reduceMotion ? 0 : TRAIL_AURA_BLUR + MELT_MASK_BLUR * meltProgress * 0.55;
    const coreBlur = reduceMotion ? 0 : TRAIL_CORE_BLUR + MELT_MASK_BLUR * meltProgress * 0.25;

    targetCtx.save();
    targetCtx.lineCap = "round";
    targetCtx.lineJoin = "round";

    targetCtx.filter = auraBlur > 0 ? `blur(${auraBlur}px)` : "none";
    targetCtx.strokeStyle = `rgba(0, 0, 0, ${0.14 + strength * 0.18})`;
    targetCtx.lineWidth = lerp(TRAIL_AURA_WIDTH * 0.84, TRAIL_AURA_WIDTH, strength);
    targetCtx.beginPath();
    targetCtx.moveTo(startStamp.x, startStamp.y);
    targetCtx.lineTo(endStamp.x, endStamp.y);
    targetCtx.stroke();

    targetCtx.filter = coreBlur > 0 ? `blur(${coreBlur}px)` : "none";
    targetCtx.strokeStyle = `rgba(0, 0, 0, ${0.26 + strength * 0.34})`;
    targetCtx.lineWidth = lerp(TRAIL_CORE_WIDTH * 0.9, TRAIL_CORE_WIDTH, strength);
    targetCtx.beginPath();
    targetCtx.moveTo(startStamp.x, startStamp.y);
    targetCtx.lineTo(endStamp.x, endStamp.y);
    targetCtx.stroke();
    targetCtx.restore();
  };

  const drawRevealStamp = (targetCtx, stamp, time, strength, meltProgress) => {
    const orbit = reduceMotion ? stamp.seed : time * 0.88 + stamp.seed;
    const auraRadius = BASE_AURA_RADIUS + strength * AURA_RADIUS_GAIN;
    const baseAlpha = 0.18 + strength * 0.52;
    const blurPx = reduceMotion ? 0 : lerp(ACTIVE_MASK_BLUR, MELT_MASK_BLUR, meltProgress);

    targetCtx.save();
    targetCtx.filter = blurPx > 0 ? `blur(${blurPx}px)` : "none";

    drawBlobAura(targetCtx, {
      x: stamp.x,
      y: stamp.y,
      radius: auraRadius * 1.16,
      alpha: baseAlpha,
      stretchX: 1.04,
      stretchY: 0.98,
      rotation: orbit * 0.14,
    });

    drawBlobAura(targetCtx, {
      x: stamp.x + Math.cos(orbit) * (12 + strength * 8),
      y: stamp.y + Math.sin(orbit * 1.1) * (8 + strength * 6),
      radius: auraRadius * 0.72,
      alpha: baseAlpha * 0.7,
      stretchX: 0.96,
      stretchY: 1.08,
      rotation: orbit * -0.22,
    });

    buildBlobPath(targetCtx, stamp, time, strength);
    targetCtx.fillStyle = `rgba(0, 0, 0, ${0.88 * strength})`;
    targetCtx.fill();
    targetCtx.restore();
  };

  const drawOrganicOverlay = (time, visibleStamps) => {
    maskCtx.fillStyle = BG_WHITE;
    maskCtx.fillRect(0, 0, width, height);
    maskCtx.globalCompositeOperation = "destination-out";

    let previousVisibleStamp = null;

    visibleStamps.forEach((entry) => {
      if (previousVisibleStamp && entry.sequence === previousVisibleStamp.sequence + 1) {
        drawTrailSegment(
          maskCtx,
          previousVisibleStamp.stamp,
          entry.stamp,
          Math.min(previousVisibleStamp.strength, entry.strength),
          Math.max(previousVisibleStamp.meltProgress, entry.meltProgress),
        );
      }

      previousVisibleStamp = entry;
    });

    visibleStamps.forEach(({ stamp, strength, meltProgress }) => {
      drawRevealStamp(maskCtx, stamp, time, strength, meltProgress);
    });

    maskCtx.globalCompositeOperation = "source-over";
  };

  const render = (now) => {
    if (disposed) return;

    frameId = window.requestAnimationFrame(render);

    const time = (now - startedAt) * 0.001;
    const viewportX = window.scrollX;
    const viewportY = window.scrollY;

    ctx.fillStyle = BG_WHITE;
    ctx.fillRect(0, 0, width, height);

    const aliveStamps = [];
    const visibleStamps = [];

    for (let index = 0; index < trailStamps.length; index += 1) {
      const stamp = trailStamps[index];
      const ageMs = now - stamp.createdAt;

      if (ageMs >= STAMP_HOLD_MS + STAMP_FADE_MS) {
        continue;
      }

      const strength = getStampAgeStrength(ageMs);
      aliveStamps.push(stamp);

      if (strength <= 0) {
        continue;
      }

      const localX = stamp.pageX - viewportX;
      const localY = stamp.pageY - viewportY;

      if (!isStampVisible(localX, localY, width, height)) {
        continue;
      }

      visibleStamps.push({
        sequence: aliveStamps.length - 1,
        strength,
        meltProgress: getStampFadeProgress(ageMs),
        stamp: {
          ...stamp,
          x: localX,
          y: localY,
        },
      });
    }

    if (aliveStamps.length !== trailStamps.length) {
      trailStamps.splice(0, trailStamps.length, ...aliveStamps);
    }

    if (visibleStamps.length === 0 || !mediaReady) {
      return;
    }

    const driftX = reduceMotion ? 0 : Math.sin(time * 0.11) * 10;
    const driftY = reduceMotion ? 0 : Math.cos(time * 0.075) * 7;

    ctx.save();
    ctx.filter = `brightness(${ACTIVE_VIDEO_BRIGHTNESS}) contrast(${ACTIVE_VIDEO_CONTRAST})`;
    ctx.globalAlpha = ACTIVE_VIDEO_ALPHA;
    drawCoverVideo(driftX, driftY);
    ctx.restore();

    maskCtx.clearRect(0, 0, width, height);
    drawOrganicOverlay(time, visibleStamps);
    ctx.drawImage(maskCanvas, 0, 0, maskCanvas.width, maskCanvas.height, 0, 0, width, height);
  };

  const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(resizeCanvas) : null;

  const dispose = () => {
    if (disposed) return;

    disposed = true;
    window.cancelAnimationFrame(frameId);
    resizeObserver?.disconnect();
    window.removeEventListener("resize", resizeCanvas);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("touchmove", onTouchMove, touchOptions);
    window.removeEventListener("pointerdown", onPointerDown, pointerDownOptions);
    window.removeEventListener("scroll", onScroll, scrollOptions);
    window.removeEventListener("pagehide", dispose);
    video.pause();
    video.removeEventListener("loadeddata", markMediaReady);
    video.removeEventListener("canplay", markMediaReady);
    video.removeAttribute("src");
    video.load();
  };

  resizeCanvas();
  resizeObserver?.observe(document.body);

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("touchmove", onTouchMove, touchOptions);
  window.addEventListener("pointerdown", onPointerDown, pointerDownOptions);
  window.addEventListener("scroll", onScroll, scrollOptions);
  window.addEventListener("pagehide", dispose);

  render(startedAt);

  return dispose;
}

export function initLandingFlowReveal() {}
