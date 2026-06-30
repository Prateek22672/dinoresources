import React, { useEffect, useRef } from "react";

interface FuzzyTextProps {
  children: React.ReactNode;
  fontSize?: number | string;
  fontWeight?: string | number;
  fontFamily?: string;
  color?: string;
  enableHover?: boolean;
  baseIntensity?: number;
  hoverIntensity?: number;
  fuzzRange?: number;
  fps?: number;
  direction?: "horizontal" | "vertical" | "both";
  gradient?: string[] | null;
  letterSpacing?: number;
  className?: string;
}

const FuzzyText: React.FC<FuzzyTextProps> = ({
  children,
  fontSize = "clamp(2rem, 10vw, 10rem)",
  fontWeight = 900,
  fontFamily = "inherit",
  color = "#fff",
  enableHover = true,
  baseIntensity = 0.18,
  hoverIntensity = 0.5,
  fuzzRange = 30,
  fps = 60,
  direction = "horizontal",
  gradient = null,
  letterSpacing = 0,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animationFrameId = 0;
    let isCancelled = false;
    const canvas = canvasRef.current as any;
    if (!canvas) return;

    const init = async () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const computedFontFamily =
        fontFamily === "inherit" ? window.getComputedStyle(canvas).fontFamily || "sans-serif" : fontFamily;
      const fontSizeStr = typeof fontSize === "number" ? `${fontSize}px` : fontSize;
      const fontString = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;

      try { await document.fonts.load(fontString); } catch { await document.fonts.ready; }
      if (isCancelled) return;

      let numericFontSize: number;
      if (typeof fontSize === "number") numericFontSize = fontSize;
      else {
        const temp = document.createElement("span");
        temp.style.fontSize = fontSize;
        document.body.appendChild(temp);
        numericFontSize = parseFloat(window.getComputedStyle(temp).fontSize);
        document.body.removeChild(temp);
      }

      const text = React.Children.toArray(children).join("");
      const offscreen = document.createElement("canvas");
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
      offCtx.textBaseline = "alphabetic";

      let totalWidth = 0;
      if (letterSpacing !== 0) {
        for (const char of text) totalWidth += offCtx.measureText(char).width + letterSpacing;
        totalWidth -= letterSpacing;
      } else totalWidth = offCtx.measureText(text).width;

      const metrics = offCtx.measureText(text);
      const actualLeft = metrics.actualBoundingBoxLeft ?? 0;
      const actualRight = letterSpacing !== 0 ? totalWidth : (metrics.actualBoundingBoxRight ?? metrics.width);
      const actualAscent = metrics.actualBoundingBoxAscent ?? numericFontSize;
      const actualDescent = metrics.actualBoundingBoxDescent ?? numericFontSize * 0.2;

      const textBoundingWidth = Math.ceil(letterSpacing !== 0 ? totalWidth : actualLeft + actualRight);
      const tightHeight = Math.ceil(actualAscent + actualDescent);
      const extraWidthBuffer = 10;
      const offscreenWidth = textBoundingWidth + extraWidthBuffer;

      offscreen.width = offscreenWidth;
      offscreen.height = tightHeight;
      const xOffset = extraWidthBuffer / 2;
      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
      offCtx.textBaseline = "alphabetic";

      if (gradient && Array.isArray(gradient) && gradient.length >= 2) {
        const grad = offCtx.createLinearGradient(0, 0, offscreenWidth, 0);
        gradient.forEach((c, i) => grad.addColorStop(i / (gradient.length - 1), c));
        offCtx.fillStyle = grad;
      } else offCtx.fillStyle = color;

      if (letterSpacing !== 0) {
        let xPos = xOffset;
        for (const char of text) { offCtx.fillText(char, xPos, actualAscent); xPos += offCtx.measureText(char).width + letterSpacing; }
      } else offCtx.fillText(text, xOffset - actualLeft, actualAscent);

      const horizontalMargin = fuzzRange + 20;
      const verticalMargin = direction === "vertical" || direction === "both" ? fuzzRange + 10 : 0;
      canvas.width = offscreenWidth + horizontalMargin * 2;
      canvas.height = tightHeight + verticalMargin * 2;
      ctx.translate(horizontalMargin, verticalMargin);

      const interactiveLeft = horizontalMargin + xOffset;
      const interactiveTop = verticalMargin;
      const interactiveRight = interactiveLeft + textBoundingWidth;
      const interactiveBottom = interactiveTop + tightHeight;

      let isHovering = false;
      let lastFrameTime = 0;
      const frameDuration = 1000 / fps;

      const run = (timestamp: number) => {
        if (isCancelled) return;
        if (timestamp - lastFrameTime < frameDuration) { animationFrameId = window.requestAnimationFrame(run); return; }
        lastFrameTime = timestamp;
        ctx.clearRect(-fuzzRange - 20, -fuzzRange - 10, offscreenWidth + 2 * (fuzzRange + 20), tightHeight + 2 * (fuzzRange + 10));
        const intensity = isHovering ? hoverIntensity : baseIntensity;
        for (let j = 0; j < tightHeight; j++) {
          let dx = 0, dy = 0;
          if (direction === "horizontal" || direction === "both") dx = Math.floor(intensity * (Math.random() - 0.5) * fuzzRange);
          if (direction === "vertical" || direction === "both") dy = Math.floor(intensity * (Math.random() - 0.5) * fuzzRange * 0.5);
          ctx.drawImage(offscreen, 0, j, offscreenWidth, 1, dx, j + dy, offscreenWidth, 1);
        }
        animationFrameId = window.requestAnimationFrame(run);
      };
      animationFrameId = window.requestAnimationFrame(run);

      const inside = (x: number, y: number) => x >= interactiveLeft && x <= interactiveRight && y >= interactiveTop && y <= interactiveBottom;
      const onMove = (e: MouseEvent) => { if (!enableHover) return; const r = canvas.getBoundingClientRect(); isHovering = inside(e.clientX - r.left, e.clientY - r.top); };
      const onLeave = () => { isHovering = false; };
      if (enableHover) { canvas.addEventListener("mousemove", onMove); canvas.addEventListener("mouseleave", onLeave); }

      canvas.cleanupFuzzyText = () => {
        window.cancelAnimationFrame(animationFrameId);
        if (enableHover) { canvas.removeEventListener("mousemove", onMove); canvas.removeEventListener("mouseleave", onLeave); }
      };
    };

    init();
    return () => { isCancelled = true; window.cancelAnimationFrame(animationFrameId); if (canvas?.cleanupFuzzyText) canvas.cleanupFuzzyText(); };
  }, [children, fontSize, fontWeight, fontFamily, color, enableHover, baseIntensity, hoverIntensity, fuzzRange, fps, direction, gradient, letterSpacing]);

  return <canvas ref={canvasRef} className={className} />;
};

export default FuzzyText;
