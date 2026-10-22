"use client";

import { useEffect, useRef } from "react";

export function MorphingBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = canvas?.closest<HTMLElement>(".hero-journey");
    const context = canvas?.getContext("2d");
    if (!canvas || !stage || !context) return;

    const ctx = context;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let startedAt = performance.now();
    let scrollProgress = 0;
    let targetPointer = { x: 0.72, y: 0.32 };
    let pointer = { ...targetPointer };
    let visible = true;

    const resize = () => {
      const bounds = stage.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = stage.offsetHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const updateScroll = () => {
      const bounds = stage.getBoundingClientRect();
      const travel = Math.max(1, stage.offsetHeight - window.innerHeight);
      scrollProgress = Math.max(0, Math.min(1, -bounds.top / travel));
    };

    const onPointerMove = (event: PointerEvent) => {
      const bounds = stage.getBoundingClientRect();
      targetPointer = {
        x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
        y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
      };
    };

    const draw = (now: number) => {
      if (!visible) return;
      const time = reducedMotion.matches ? 0 : (now - startedAt) / 1000;
      const progress = scrollProgress * scrollProgress * (3 - 2 * scrollProgress);
      pointer.x += (targetPointer.x - pointer.x) * 0.035;
      pointer.y += (targetPointer.y - pointer.y) * 0.035;

      ctx.clearRect(0, 0, width, height);

      const startX = width * 0.72;
      const endX = width * 0.79;
      const startY = width < 640 ? Math.min(800, window.innerHeight * 0.95) : Math.min(450, window.innerHeight * 0.47);
      const endY = Math.max(startY + 120, height - Math.min(390, window.innerHeight * 0.44));
      const pointerPull = reducedMotion.matches ? 0 : 34;
      const x = startX + (endX - startX) * progress + (pointer.x - 0.72) * pointerPull;
      const y = startY + (endY - startY) * progress + (pointer.y - 0.32) * pointerPull;
      const radius = Math.min(width, window.innerHeight) * (0.29 - progress * 0.035);
      const pointerAngle = Math.atan2(pointer.y - y / height, pointer.x - x / width);

      const blobPath = (scale: number, phase: number, amount: number) => {
        ctx.beginPath();
        const count = 180;
        for (let index = 0; index <= count; index += 1) {
          const angle = (index / count) * Math.PI * 2;
          const flower = Math.sin(angle * 5 + time * 0.22 + phase) * (0.17 * (1 - progress));
          const softWave = Math.cos(angle * 3 - time * 0.18 + phase) * (0.075 * (1 - progress));
          const settled = Math.cos(angle * 2 + phase * 0.6) * (0.1 * progress);
          const pointerRipple = Math.cos(angle - pointerAngle) * 0.035 * (reducedMotion.matches ? 0 : 1);
          const r = radius * scale * (1 + flower + softWave + settled + pointerRipple * amount);
          const xRatio = 1.05 - progress * 0.11;
          const yRatio = 0.88 + progress * 0.1;
          const px = x + Math.cos(angle) * r * xRatio;
          const py = y + Math.sin(angle) * r * yRatio;
          if (index === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
      };

      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowColor = "rgba(126, 74, 100, .15)";
      ctx.shadowBlur = 52;
      const wash = ctx.createRadialGradient(x - radius * 0.45, y - radius * 0.55, radius * 0.04, x, y, radius * 1.65);
      wash.addColorStop(0, "rgba(255, 226, 153, .94)");
      wash.addColorStop(0.34, "rgba(255, 151, 119, .87)");
      wash.addColorStop(0.72, "rgba(208, 156, 221, .76)");
      wash.addColorStop(1, "rgba(208, 156, 221, 0)");
      blobPath(1, 0, 1);
      ctx.fillStyle = wash;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.globalAlpha = 0.33;
      ctx.strokeStyle = "rgba(103, 70, 106, .62)";
      ctx.lineWidth = 1;
      blobPath(0.84, 0.35, 0.6);
      ctx.stroke();
      ctx.globalAlpha = 0.18;
      blobPath(0.68, 0.7, 0.4);
      ctx.stroke();

      const orbit = radius * (1.42 - progress * 0.12);
      const orbitAngle = time * 0.2 + progress * Math.PI * 0.6;
      ctx.globalAlpha = 0.78;
      ctx.fillStyle = "#fff6d9";
      ctx.beginPath();
      ctx.arc(x + Math.cos(orbitAngle) * orbit, y + Math.sin(orbitAngle) * orbit * 0.82, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#bd6a63";
      ctx.beginPath();
      ctx.arc(x + Math.cos(orbitAngle + Math.PI) * orbit * 0.8, y + Math.sin(orbitAngle + Math.PI) * orbit * 0.68, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      frame = window.requestAnimationFrame(draw);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) frame = window.requestAnimationFrame(draw);
      if (!visible && frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    }, { rootMargin: "150px" });

    resize();
    updateScroll();
    observer.observe(stage);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", updateScroll, { passive: true });
    stage.addEventListener("pointermove", onPointerMove, { passive: true });
    frame = window.requestAnimationFrame(draw);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", updateScroll);
      stage.removeEventListener("pointermove", onPointerMove);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className="morphing-backdrop" aria-hidden="true" />;
}
