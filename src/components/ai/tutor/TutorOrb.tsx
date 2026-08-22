/**
 * The tutor's face — a morphing accent orb that changes state with what the
 * tutor is doing. Purely decorative, so it is hidden from assistive tech; the
 * status it conveys is always also written out in text beside it.
 */
export default function TutorOrb({
  size = 44,
  busy = false,
}: {
  size?: number;
  /** Thinking: the orb churns faster and emits rings. */
  busy?: boolean;
}) {
  return (
    <span
      aria-hidden
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      {busy && (
        <>
          <span className="td-orb-ring absolute inset-0 rounded-full" />
          <span className="td-orb-ring absolute inset-0 rounded-full" style={{ animationDelay: "0.6s" }} />
        </>
      )}
      {/* soft halo */}
      <span
        className="absolute rounded-full"
        style={{
          inset: -size * 0.22,
          background: "rgb(var(--td-accent-rgb) / 0.22)",
          filter: `blur(${Math.round(size * 0.28)}px)`,
        }}
      />
      <span
        className={`td-orb relative block ${busy ? "td-orb-busy" : ""}`}
        style={{ width: size * 0.72, height: size * 0.72 }}
      />
      {/* highlight — gives the blob a sense of volume without a gradient */}
      <span
        className="absolute rounded-full"
        style={{
          width: size * 0.2,
          height: size * 0.2,
          top: size * 0.2,
          left: size * 0.26,
          background: "rgba(255,255,255,0.5)",
          filter: "blur(3px)",
        }}
      />
    </span>
  );
}
