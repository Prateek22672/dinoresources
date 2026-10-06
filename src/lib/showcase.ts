import { supabase } from "@/integrations/supabase/client";

/** Campus Showcase — see supabase/migrations/20261006150000_campus_showcase.sql. */
export type ShowcaseStatus = "pending" | "approved" | "rejected" | "hidden";
export type ShowcaseCategory = "project" | "startup" | "research" | "design" | "event" | "other";

export interface ShowcasePost {
  id: string;
  author_id: string;
  author_name: string | null;
  title: string;
  tagline: string;
  description: string;
  category: ShowcaseCategory;
  tags: string[];
  team: string | null;
  cover_url: string | null;
  live_url: string | null;
  repo_url: string | null;
  status: ShowcaseStatus;
  reject_reason: string | null;
  featured: boolean;
  like_count: number;
  created_at: string;
  approved_at: string | null;
}

export const CATEGORIES: { id: ShowcaseCategory; label: string }[] = [
  { id: "project", label: "Projects" },
  { id: "startup", label: "Startups" },
  { id: "research", label: "Research" },
  { id: "design", label: "Design" },
  { id: "event", label: "Events" },
  { id: "other", label: "Other" },
];

export const categoryLabel = (c: ShowcaseCategory) =>
  CATEGORIES.find((x) => x.id === c)?.label.replace(/s$/, "") ?? "Project";

// cover gradients for posts without an image — stable per post title
const TONES: [string, string][] = [
  ["#6f8fe0", "#1b2350"], ["#7fc4ad", "#1d4038"], ["#e6c25e", "#6b4a12"],
  ["#8b7fd8", "#2c2363"], ["#e07a8e", "#4a1830"], ["#f29a6b", "#5a2414"],
];
export function toneFor(key: string): [string, string] {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

/** "Trending": likes, decayed by age, so a fresh post can beat an old one. */
export function trendScore(p: ShowcasePost): number {
  const days = (Date.now() - new Date(p.approved_at ?? p.created_at).getTime()) / 86_400_000;
  return (p.like_count + 1) / Math.pow(days + 2, 1.3);
}

export const sb = supabase as any;

/** Upload a cover image into the student's own folder of the public bucket. */
export async function uploadCover(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Pick an image file (PNG, JPG, WebP or GIF).");
  if (file.size > 3 * 1024 * 1024) throw new Error("That image is over 3MB — try a smaller one.");
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await sb.storage.from("showcase").upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw new Error(error.message);
  return sb.storage.from("showcase").getPublicUrl(path).data.publicUrl as string;
}

/** Normalise a link a student typed ("github.com/x" → "https://github.com/x"). */
export function cleanUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try { return new URL(withScheme).toString(); } catch { return null; }
}

/** An href only for real web links — a crafted `javascript:` URL renders as nothing. */
export const safeHref = (u: string | null | undefined): string | undefined =>
  u && /^https?:\/\//i.test(u) ? u : undefined;

export const ago = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
};
