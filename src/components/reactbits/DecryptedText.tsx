import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { motion } from "motion/react";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: "start" | "end" | "center";
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: "view" | "hover" | "click";
  [key: string]: any;
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = "start",
  useOriginalCharsOnly = false,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+",
  className = "",
  parentClassName = "",
  encryptedClassName = "",
  animateOn = "hover",
  ...props
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLSpanElement | null>(null);

  const availableChars = useMemo(
    () => (useOriginalCharsOnly ? Array.from(new Set(text.split(""))).filter((c) => c !== " ") : characters.split("")),
    [useOriginalCharsOnly, text, characters],
  );

  const shuffleText = useCallback(
    (original: string, revealed: Set<number>) =>
      original.split("").map((ch, i) => (ch === " " ? " " : revealed.has(i) ? original[i] : availableChars[Math.floor(Math.random() * availableChars.length)])).join(""),
    [availableChars],
  );

  const triggerDecrypt = useCallback(() => { setRevealedIndices(new Set()); setIsAnimating(true); }, []);

  useEffect(() => {
    if (!isAnimating) return;
    let iteration = 0;
    const id = setInterval(() => {
      setRevealedIndices((prev) => {
        if (sequential) {
          if (prev.size < text.length) {
            const next = new Set(prev);
            const idx = revealDirection === "end" ? text.length - 1 - prev.size
              : revealDirection === "center" ? (prev.size % 2 === 0 ? Math.floor(text.length / 2) + Math.floor(prev.size / 2) : Math.floor(text.length / 2) - Math.floor(prev.size / 2) - 1)
              : prev.size;
            next.add(Math.max(0, Math.min(text.length - 1, idx)));
            setDisplayText(shuffleText(text, next));
            return next;
          }
          clearInterval(id); setIsAnimating(false); setDisplayText(text); return prev;
        }
        setDisplayText(shuffleText(text, prev));
        iteration++;
        if (iteration >= maxIterations) { clearInterval(id); setIsAnimating(false); setDisplayText(text); }
        return prev;
      });
    }, speed);
    return () => clearInterval(id);
  }, [isAnimating, text, speed, maxIterations, sequential, revealDirection, shuffleText]);

  useEffect(() => {
    if (animateOn !== "view") return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting && !hasAnimated) { triggerDecrypt(); setHasAnimated(true); } });
    }, { threshold: 0.1 });
    const cur = containerRef.current;
    if (cur) obs.observe(cur);
    return () => { if (cur) obs.unobserve(cur); };
  }, [animateOn, hasAnimated, triggerDecrypt]);

  const hoverProps = animateOn === "hover"
    ? { onMouseEnter: () => { if (!isAnimating) triggerDecrypt(); } }
    : animateOn === "click" ? { onClick: () => { if (!isAnimating) triggerDecrypt(); } } : {};

  return (
    <motion.span ref={containerRef} className={`inline-block whitespace-pre-wrap ${parentClassName}`} {...hoverProps} {...props}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {displayText.split("").map((ch, i) => {
          const revealed = revealedIndices.has(i) || (!isAnimating);
          return <span key={i} className={revealed ? className : encryptedClassName}>{ch}</span>;
        })}
      </span>
    </motion.span>
  );
}
