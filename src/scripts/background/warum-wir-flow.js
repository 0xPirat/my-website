const VIDEO_URL = "/pictures/elements/backgrounds_landingpage/morionbackground.mp4";
const BG_WHITE = "#ffffff";
const POINTER_LERP = 0.06;
const REDUCED_POINTER_LERP = 0.3;
const STAMP_SPACING = 18;
const STAMP_MIN_INTERVAL_MS = 44;
const MAX_STAMPS = 420;
const STAMP_HOLD_MS = 4000;
const STAMP_FADE_MS = 1600;
const ACTIVE_VIDEO_ALPHA = 0.4;
const ACTIVE_VIDEO_BRIGHTNESS = 1.12;
const ACTIVE_VIDEO_CONTRAST = 0.78;
const BASE_RADIUS = 31;
const RADIUS_GAIN = 19;
const BASE_AURA_RADIUS = 36;
const AURA_RADIUS_GAIN = 24;

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
  let smoothX = 0;
  let smoothY = 0;
  let frameId = 0;
  let disposed = false;
  let mediaReady = false;
  let lastStampX = Number.NaN;
  let lastStampY = Number.NaN;
  let lastStampTime = 0;
  const trailStamps = [];
  const startedAt = performance.now();
  const touchOptions = { passive: true };
  const pointerDownOptions = { passive: true };

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

    if (!Number.isFinite(rawX) || !Number.isFinite(rawY) || (rawX === 0 && rawY === 0)) {
      rawX = width * 0.5;
      rawY = height * 0.5;
      smoothX = rawX;
      smoothY = rawY;
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

  const pushStamp = (x, y, createdAt, velocityX, velocityY) => {
    trailStamps.push({
      x,
      y,
      createdAt,
      seed: Math.random() * Math.PI * 2,
      wobbleSeed: Math.random() * 1000,
      velocityX,
      velocityY,
    });

    if (trailStamps.length > MAX_STAMPS) {
      trailStamps.splice(0, trailStamps.length - MAX_STAMPS);
    }
  };

  const stampAlongPath = (x, y, velocityX, velocityY, force = false) => {
    const now = performance.now();
    const hasPreviousStamp = Number.isFinite(lastStampX) && Number.isFinite(lastStampY);
    const distance = hasPreviousStamp ? Math.hypot(x - lastStampX, y - lastStampY) : 0;
    const elapsed = now - lastStampTime;

    if (!force && hasPreviousStamp && distance < STAMP_SPACING && elapsed < STAMP_MIN_INTERVAL_MS) {
      return;
    }

    if (!hasPreviousStamp) {
      pushStamp(x, y, now, velocityX, velocityY);
      lastStampX = x;
      lastStampY = y;
      lastStampTime = now;
      return;
    }

    const stepCount = Math.max(1, Math.ceil(distance / STAMP_SPACING));
    const startX = lastStampX;
    const startY = lastStampY;

    for (let index = 1; index <= stepCount; index += 1) {
      const progress = index / stepCount;
      pushStamp(
        lerp(startX, x, progress),
        lerp(startY, y, progress),
        now - (stepCount - index) * 12,
        velocityX,
        velocityY,
      );
    }

    lastStampX = x;
    lastStampY = y;
    lastStampTime = now;
  };

  const setPointer = (x, y, forceStamp = false) => {
    const velocityX = x - rawX;
    const velocityY = y - rawY;

    rawX = x;
    rawY = y;

    if (reduceMotion) {
      smoothX = x;
      smoothY = y;
    }

    stampAlongPath(x, y, velocityX, velocityY, forceStamp);
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

  const drawBlobAura = ({ x, y, radius, alpha, stretchX, stretchY, rotation }) => {
    maskCtx.save();
    maskCtx.translate(x, y);
    maskCtx.rotate(rotation);
    maskCtx.scale(stretchX, stretchY);

    const gradient = maskCtx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
    gradient.addColorStop(0.42, `rgba(0, 0, 0, ${alpha * 0.86})`);
    gradient.addColorStop(0.78, `rgba(0, 0, 0, ${alpha * 0.28})`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    maskCtx.fillStyle = gradient;
    maskCtx.beginPath();
    maskCtx.arc(0, 0, radius, 0, Math.PI * 2);
    maskCtx.fill();
    maskCtx.restore();
  };

  const buildBlobPath = (stamp, time, strength) => {
    const pointCount = 30;
    const flow = reduceMotion ? stamp.seed : time * 1.74 + stamp.seed;
    const baseRadius = BASE_RADIUS + strength * RADIUS_GAIN;
    const centerX = stamp.x + (reduceMotion ? 0 : Math.sin(flow * 0.64 + stamp.wobbleSeed) * 2.6);
    const centerY = stamp.y + (reduceMotion ? 0 : Math.cos(flow * 0.58 + stamp.wobbleSeed) * 2.1);
    const velocityNormX = width > 0 ? clamp(stamp.velocityX / 48, -1, 1) : 0;
    const velocityNormY = height > 0 ? clamp(stamp.velocityY / 48, -1, 1) : 0;
    const skewX = reduceMotion ? 0 : Math.sin(flow * 0.52 + stamp.seed * 2.1) * 0.12;
    const skewY = reduceMotion ? 0 : Math.cos(flow * 0.46 + stamp.seed * 1.6) * 0.1;

    maskCtx.beginPath();

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
        maskCtx.moveTo(x, y);
      } else {
        maskCtx.lineTo(x, y);
      }
    }

    maskCtx.closePath();
  };

  const drawRevealStamp = (stamp, time, strength, blurPx) => {
    const orbit = reduceMotion ? stamp.seed : time * 0.88 + stamp.seed;
    const auraRadius = BASE_AURA_RADIUS + strength * AURA_RADIUS_GAIN;
    const baseAlpha = 0.18 + strength * 0.52;

    maskCtx.save();
    maskCtx.filter = blurPx > 0 ? `blur(${blurPx}px)` : "none";

    drawBlobAura({
      x: stamp.x,
      y: stamp.y,
      radius: auraRadius * 1.16,
      alpha: baseAlpha,
      stretchX: 1.04,
      stretchY: 0.98,
      rotation: orbit * 0.14,
    });

    drawBlobAura({
      x: stamp.x + Math.cos(orbit) * (12 + strength * 8),
      y: stamp.y + Math.sin(orbit * 1.1) * (8 + strength * 6),
      radius: auraRadius * 0.72,
      alpha: baseAlpha * 0.7,
      stretchX: 0.96,
      stretchY: 1.08,
      rotation: orbit * -0.22,
    });

    buildBlobPath(stamp, time, strength);
    maskCtx.fillStyle = `rgba(0, 0, 0, ${0.88 * strength})`;
    maskCtx.fill();
    maskCtx.restore();
  };

  const drawOrganicOverlay = (time, visibleStamps) => {
    maskCtx.fillStyle = BG_WHITE;
    maskCtx.fillRect(0, 0, width, height);
    maskCtx.globalCompositeOperation = "destination-out";

    visibleStamps.forEach(({ stamp, strength, blurPx }) => {
      drawRevealStamp(stamp, time, strength, blurPx);
    });

    maskCtx.globalCompositeOperation = "source-over";
  };

  const render = (now) => {
    if (disposed) return;

    frameId = window.requestAnimationFrame(render);

    const time = (now - startedAt) * 0.001;
    const pointerLerp = reduceMotion ? REDUCED_POINTER_LERP : POINTER_LERP;
    smoothX += (rawX - smoothX) * pointerLerp;
    smoothY += (rawY - smoothY) * pointerLerp;

    ctx.fillStyle = BG_WHITE;
    ctx.fillRect(0, 0, width, height);

    const visibleStamps = [];

    for (let index = 0; index < trailStamps.length; index += 1) {
      const stamp = trailStamps[index];
      const age = now - stamp.createdAt;
      const strength = getStampAgeStrength(age);

      if (strength <= 0) {
        continue;
      }

      visibleStamps.push({
        stamp,
        strength,
        blurPx: reduceMotion ? 0 : getStampFadeProgress(age) * 9,
      });
    }

    if (visibleStamps.length !== trailStamps.length) {
      trailStamps.splice(
        0,
        trailStamps.length,
        ...visibleStamps.map(({ stamp }) => stamp),
      );
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
  window.addEventListener("pagehide", dispose);

  render(startedAt);

  return dispose;
}

export function initLandingFlowReveal() {}
