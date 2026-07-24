import { useRef, useState, useEffect } from "react";
import Matter from "matter-js";

interface FallingTextProps {
  text?: string;
  highlightWords?: string[];
  highlightClass?: string;
  trigger?: "click" | "hover" | "auto" | "scroll";
  backgroundColor?: string;
  wireframes?: boolean;
  gravity?: number;
  mouseConstraintStiffness?: number;
  fontSize?: string;
  className?: string;
  /** Extra falling bodies rendered from raw HTML (e.g. a book SVG) — they
   *  tumble with the words and can be dragged just the same. */
  objects?: string[];
}

const FallingText = ({
  text = "",
  highlightWords = [],
  highlightClass = "td-accent-text font-bold",
  trigger = "scroll",
  backgroundColor = "transparent",
  wireframes = false,
  gravity = 0.56,
  mouseConstraintStiffness = 0.9,
  fontSize = "2rem",
  className = "",
  objects = [],
}: FallingTextProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [effectStarted, setEffectStarted] = useState(false);

  useEffect(() => {
    if (!textRef.current) return;
    const words = text.split(" ");
    const wordHtml = words
      .map((word) => {
        const hl = highlightWords.some((hw) => word.startsWith(hw));
        return `<span class="inline-block mx-[3px] select-none ${hl ? highlightClass : ""}">${word}</span>`;
      })
      .join(" ");
    // extra objects (e.g. a book SVG) become falling bodies too
    const objHtml = objects
      .map((o) => `<span class="inline-block mx-[3px] align-middle select-none">${o}</span>`)
      .join(" ");
    textRef.current.innerHTML = wordHtml + (objHtml ? " " + objHtml : "");
  }, [text, highlightWords, highlightClass, objects]);

  useEffect(() => {
    if (trigger === "auto") { setEffectStarted(true); return; }
    if (trigger === "scroll" && containerRef.current) {
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { setEffectStarted(true); obs.disconnect(); }
      }, { threshold: 0.1 });
      obs.observe(containerRef.current);
      return () => obs.disconnect();
    }
  }, [trigger]);

  useEffect(() => {
    if (!effectStarted || !containerRef.current || !textRef.current || !canvasContainerRef.current) return;
    const { Engine, Render, World, Bodies, Runner, Mouse, MouseConstraint } = Matter;

    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width, height = rect.height;
    if (width <= 0 || height <= 0) return;

    const engine = Engine.create();
    engine.world.gravity.y = gravity;
    const render = Render.create({
      element: canvasContainerRef.current, engine,
      options: { width, height, background: backgroundColor, wireframes },
    });

    const opts = { isStatic: true, render: { fillStyle: "transparent" } };
    const floor = Bodies.rectangle(width / 2, height + 25, width, 50, opts);
    const left = Bodies.rectangle(-25, height / 2, 50, height, opts);
    const right = Bodies.rectangle(width + 25, height / 2, 50, height, opts);
    const ceiling = Bodies.rectangle(width / 2, -25, width, 50, opts);

    const spans = textRef.current.querySelectorAll("span");
    const bodies = [...spans].map((elem) => {
      const r = elem.getBoundingClientRect();
      const x = r.left - rect.left + r.width / 2;
      const y = r.top - rect.top + r.height / 2;
      const body = Bodies.rectangle(x, y, r.width, r.height, {
        render: { fillStyle: "transparent" }, restitution: 0.8, frictionAir: 0.01, friction: 0.2,
      });
      Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 5, y: 0 });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);
      return { elem: elem as HTMLElement, body };
    });

    bodies.forEach(({ elem }) => { elem.style.position = "absolute"; elem.style.transform = "none"; });

    const mouse = Mouse.create(containerRef.current);
    // IMPORTANT: matter-js binds wheel + touch handlers that swallow page
    // scrolling whenever the cursor is over this band. Detach them so the page
    // scrolls normally (desktop word-dragging via mousedown still works).
    const m = mouse as any;
    mouse.element.removeEventListener("mousewheel", m.mousewheel);
    mouse.element.removeEventListener("DOMMouseScroll", m.mousewheel);
    mouse.element.removeEventListener("touchstart", m.mousedown);
    mouse.element.removeEventListener("touchmove", m.mousemove);
    mouse.element.removeEventListener("touchend", m.mouseup);
    const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: mouseConstraintStiffness, render: { visible: false } } });
    render.mouse = mouse;

    World.add(engine.world, [floor, left, right, ceiling, mc, ...bodies.map((b) => b.body)]);
    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    let raf = 0;
    const loop = () => {
      bodies.forEach(({ body, elem }) => {
        elem.style.left = `${body.position.x}px`;
        elem.style.top = `${body.position.y}px`;
        elem.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      });
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      Render.stop(render); Runner.stop(runner);
      if (render.canvas && canvasContainerRef.current?.contains(render.canvas)) canvasContainerRef.current.removeChild(render.canvas);
      World.clear(engine.world, false); Engine.clear(engine);
    };
  }, [effectStarted, gravity, wireframes, backgroundColor, mouseConstraintStiffness]);

  return (
    <div ref={containerRef} className={`relative z-[1] w-full h-full cursor-grab overflow-hidden ${className}`}>
      <div ref={textRef} className="inline-block" style={{ fontSize, lineHeight: 1.4 }} />
      <div ref={canvasContainerRef} className="absolute top-0 left-0 z-0" />
    </div>
  );
};

export default FallingText;
