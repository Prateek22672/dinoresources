import { Lightbulb, Bot } from "lucide-react";
import dinoBlack from "@/assets/dinosaurBlack.png";

/**
 * Brand icon wrappers — drop-in replacements for lucide icons (accept className
 * etc.). Theme-aware: white assets turn black on the light theme and vice versa.
 */

/** Study-With-AI mark. The sparkle-stars artwork is retired site-wide; a
 *  lightbulb ("explains it to you") stands in, drawn in currentColor so it
 *  follows the theme like any other icon. */
export const AiIcon = ({ className = "", ..._rest }: { className?: string; [k: string]: any }) => (
  <Lightbulb className={className} aria-hidden />
);

/** Agent / assistant mark — was a sparkle artwork too. */
export const GenAiIcon = ({ className = "", ..._rest }: { className?: string; [k: string]: any }) => (
  <Bot className={className} aria-hidden />
);


/** The dino. Black in light theme, white in dark. */
export const DinoIcon = ({ className = "", ..._rest }: { className?: string; [k: string]: any }) => (
  <img src={dinoBlack} alt="" draggable={false} className={`select-none dark:invert ${className}`} />
);

/** The dino, always black (for fixed white surfaces like the wheel hub). */
export const DinoBlackIcon = ({ className = "", ..._rest }: { className?: string; [k: string]: any }) => (
  <img src={dinoBlack} alt="" draggable={false} className={`select-none ${className}`} />
);
