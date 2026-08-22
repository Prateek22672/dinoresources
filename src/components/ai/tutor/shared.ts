/**
 * Shared contract for the Study-With-AI tutor.
 *
 * The tutor is retrieval-first: the `study-buddy` edge function searches the
 * Q&A the team wrote for this subject and answers from it. `grounding` says
 * which of those two things actually happened, and the UI always shows it —
 * a student should never have to guess whether they're reading their own
 * course material or the model's general knowledge.
 */
import { supabase } from "@/integrations/supabase/client";
import { invokeFn } from "@/integrations/supabase/revamp";

/** Which face of the tutor is showing. */
export type TutorMode = "chat" | "drill" | "recall";

/**
 * A proactive offer from Rex, shown next to the launcher.
 *
 * Deliberately small and easy to ignore: it appears when a student has just
 * opened a long answer (the moment help is actually wanted), never interrupts,
 * and dismissing it buys silence rather than just hiding one bubble.
 */
export interface TutorNudge {
  /** Stable per trigger, so the same prompt is never queued twice. */
  id: string;
  text: string;
  actions: { label: string; seed?: string; mode?: TutorMode }[];
}

/** Where the answer's facts came from. */
export type Grounding = "notes" | "mixed" | "beyond" | "locked";

export interface TutorSource {
  id: string;
  question: string;
  unit: number;
  topic: string | null;
}

export interface TutorMessage {
  role: "user" | "assistant";
  content: string;
  grounding?: Grounding;
  sources?: TutorSource[];
  followups?: string[];
  searched?: number;
  degraded?: boolean;
  /** Set on the newest reply so it types itself in once, then stays put. */
  fresh?: boolean;
}

export interface DrillQuestion {
  id: string;
  q: string;
  options: string[];
  answer: number;
  why: string;
  source_id: string | null;
  source_q: string | null;
  unit: number | null;
}

export interface GradeResult {
  score: number;
  verdict: string;
  hits: string[];
  misses: string[];
  tip: string;
  model_answer: string;
  degraded: boolean;
}

/** What the tutor knows about the page the student is looking at. */
export interface TutorContext {
  subjectId: string;
  subjectName: string;
  /** Unit currently open, or null on the syllabus / PYQ sections. */
  unit: number | null;
  /** Title of the topic filter the student has applied, if any. */
  topic: string | null;
  hasAccess: boolean;
  qa: TutorQa[];
  topics: { id: string; title: string }[];
}

export interface TutorQa {
  id: string;
  question: string;
  unit_number: number;
  answer_md: string | null;
  is_free: boolean;
  topic_id?: string | null;
}

export const GROUNDING_LABEL: Record<Grounding, { label: string; hint: string; tone: string }> = {
  notes: {
    label: "From your notes",
    hint: "Answered from this subject's own Study-With-AI material.",
    tone: "emerald",
  },
  mixed: {
    label: "Notes + context",
    hint: "Mostly your notes, with anything extra marked in the answer.",
    tone: "accent",
  },
  beyond: {
    label: "Beyond your syllabus",
    hint: "Your notes don't cover this — answered from general knowledge.",
    tone: "amber",
  },
  locked: {
    label: "Locked material",
    hint: "The full answer to this is in the subject you haven't unlocked.",
    tone: "zinc",
  },
};

/**
 * Jump the page behind the panel to a cited Q&A and open it. The tutor citing
 * a source is only half the trick — being able to tap it and land on the real
 * answer is what makes the citation worth showing.
 */
export function jumpToSource(qaId: string) {
  try {
    window.dispatchEvent(new CustomEvent("td:tutor-jump", { detail: { qaId } }));
  } catch { /* non-critical */ }
}

interface ChatReply {
  reply: string;
  grounding: Grounding;
  sources: TutorSource[];
  followups: string[];
  searched: number;
  degraded?: boolean;
}

export async function askTutor(
  ctx: TutorContext,
  messages: { role: string; content: string }[],
): Promise<{ data: ChatReply | null; error: string | null }> {
  return invokeFn<ChatReply>("study-buddy", {
    mode: "chat",
    subject_id: ctx.subjectId,
    subject_name: ctx.subjectName,
    unit: ctx.unit ?? undefined,
    topic: ctx.topic ?? undefined,
    messages,
  });
}

export async function buildDrill(
  ctx: TutorContext,
  opts: { unit: number | null; topic: string | null; count: number; difficulty: string },
): Promise<{ data: { questions: DrillQuestion[] } | null; error: string | null }> {
  return invokeFn<{ questions: DrillQuestion[] }>("study-buddy", {
    mode: "quiz",
    subject_id: ctx.subjectId,
    subject_name: ctx.subjectName,
    unit: opts.unit ?? undefined,
    topic: opts.topic ?? undefined,
    count: opts.count,
    difficulty: opts.difficulty,
  });
}

export async function gradeAnswer(
  ctx: TutorContext,
  payload: { question: string; answer: string; sourceId: string | null; unit: number | null },
): Promise<{ data: GradeResult | null; error: string | null }> {
  return invokeFn<GradeResult>("study-buddy", {
    mode: "grade",
    subject_id: ctx.subjectId,
    subject_name: ctx.subjectName,
    unit: payload.unit ?? undefined,
    question: payload.question,
    answer: payload.answer,
    source_id: payload.sourceId ?? undefined,
  });
}

/**
 * The revamp RPCs aren't in the generated Supabase types yet. Reach them
 * through a narrow structural type rather than casting the client to `any`,
 * so the call site still gets a checked shape back.
 */
type LooseRpc = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
};
export const callRpc = (fn: string, args: Record<string, unknown>) =>
  (supabase as unknown as LooseRpc).rpc(fn, args);

export interface MasteryRow {
  unit_number: number | null;
  attempts: number;
  pct: number;
  last_at: string;
}

/** Score band shown on drill and recall results. Mirrors lib/readiness bands. */
export function scoreBand(pct: number): { label: string; color: string; line: string } {
  if (pct >= 85) return { label: "Exam ready", color: "#34d399", line: "You could sit this paper today." };
  if (pct >= 65) return { label: "Nearly there", color: "var(--td-accent)", line: "Solid grip — patch the gaps below." };
  if (pct >= 40) return { label: "Getting there", color: "#f59e0b", line: "The shape is right, the detail isn't yet." };
  return { label: "Needs a revisit", color: "#f87171", line: "Read the unit once more, then drill again." };
}
