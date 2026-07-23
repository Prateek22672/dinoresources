import ai from "@/assets/aiWhite.png";
import genai from "@/assets/genaiWhite.png";
import dinoBlack from "@/assets/dinosaurBlack.png";

/**
 * Brand icon wrappers — drop-in replacements for lucide icons (accept className
 * etc.). Theme-aware: white assets turn black on the light theme and vice versa.
 */

/** Sparkle stars (Study-With-AI mark). White in dark theme, black in light. */
export const AiIcon = ({ className = "", ..._rest }: { className?: string; [k: string]: any }) => (
  <img src={ai} alt="" draggable={false} className={`select-none invert dark:invert-0 ${className}`} />
);

/** "AI" badge mark. White in dark theme, black in light. */
export const GenAiIcon = ({ className = "", ..._rest }: { className?: string; [k: string]: any }) => (
  <img src={genai} alt="" draggable={false} className={`select-none invert dark:invert-0 ${className}`} />
);

/** The dino. Black in light theme, white in dark. */
export const DinoIcon = ({ className = "", ..._rest }: { className?: string; [k: string]: any }) => (
  <img src={dinoBlack} alt="" draggable={false} className={`select-none dark:invert ${className}`} />
);

/** The dino, always black (for fixed white surfaces like the wheel hub). */
export const DinoBlackIcon = ({ className = "", ..._rest }: { className?: string; [k: string]: any }) => (
  <img src={dinoBlack} alt="" draggable={false} className={`select-none ${className}`} />
);
