import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { tbl, invokeFn, SubjectQARow, EditorialRow, TopicRow } from "@/integrations/supabase/revamp";
import { MarkdownRenderer } from "@/components/ai/MarkdownRenderer";
import {
  Sparkles, FileText, ChevronDown, ExternalLink, Youtube, FileIcon, Layers, Eye, Clapperboard, Play, RefreshCw,
  Lock, Gift, Check, Plus, ArrowRight,
} from "lucide-react";
import { AiIcon } from "@/components/BrandIcons";
import { markStudied, ReadinessSection } from "@/lib/readiness";

interface ResourceRow {
  id: string; title: string; type: "pdf" | "youtube" | "link"; url: string;
  category: string; unit_number: number | null; topic_id?: string | null;
}

type Section = "syllabus" | "pyq" | number;
type UnitTab = "ai" | "editorial" | "resources";

interface UnitViewProps {
  subjectId: string;
  subjectName?: string;
  section: Section;
  hasAccess: boolean;
  onUnlock?: () => void;
  // free-preview unlock CTA (shown to non-owners)
  priceLabel?: string;
  inCart?: boolean;
  onAddToCart?: () => void;
}

/** Convert a Drive/YouTube share URL into an embeddable preview URL. */
function toEmbedUrl(url: string): string | null {
  const driveId = url.match(/\/file\/d\/([^/]+)/)?.[1] || url.match(/[?&]id=([^&]+)/)?.[1];
  if (url.includes("drive.google.com") && driveId) return `https://drive.google.com/file/d/${driveId}/preview`;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)?.[1];
  if (yt) return `https://www.youtube.com/embed/${yt}`;
  if (/\.pdf($|\?)/i.test(url)) return url;
  return null;
}

const resTypeIcon = { pdf: FileIcon, youtube: Youtube, link: ExternalLink };

/** Extract a YouTube video id (for thumbnails). */
function ytId(url: string): string | null {
  return url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)?.[1] ?? null;
}

export default function UnitView({ subjectId, subjectName, section, hasAccess, priceLabel, inCart, onAddToCart }: UnitViewProps) {
  const isUnit = typeof section === "number";
  const [tab, setTab] = useState<UnitTab>("ai");

  // readiness section key for this view
  const readinessKey: ReadinessSection =
    section === "syllabus" ? "syllabus" : section === "pyq" ? "pyq" : `unit-${section}`;

  const [qa, setQa] = useState<SubjectQARow[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [editorial, setEditorial] = useState<EditorialRow[]>([]);
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [activeTopic, setActiveTopic] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openMaterial, setOpenMaterial] = useState<string | null>(null);

  // related videos (real YouTube via Data API, or Groq search fallback)
  const [related, setRelated] = useState<{ title: string; channel: string; query?: string; videoId?: string; thumbnail?: string | null }[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedTried, setRelatedTried] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [edPlaying, setEdPlaying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setTab("ai");
    setActiveTopic("all");
    if (isUnit) {
      const [qaRes, edRes, tpRes] = await Promise.all([
        tbl("subject_qa").select("*").eq("subject_id", subjectId).eq("unit_number", section).order("order_index", { ascending: true }),
        tbl("subject_editorial").select("*").eq("subject_id", subjectId).or(`unit_number.eq.${section},unit_number.is.null`).order("created_at", { ascending: false }),
        tbl("unit_topics").select("*").eq("subject_id", subjectId).eq("unit_number", section).order("order_index", { ascending: true }),
      ]);
      setQa((qaRes.data ?? []) as SubjectQARow[]);
      setEditorial((edRes.data ?? []) as EditorialRow[]);
      setTopics((tpRes.data ?? []) as TopicRow[]);
    } else { setQa([]); setEditorial([]); setTopics([]); }

    const { data: allRes } = await (supabase.from("resources") as any).select("id, title, type, url, category, unit_number, topic_id").eq("subject_id", subjectId);
    const all = (allRes ?? []) as ResourceRow[];
    setResources(all.filter((r) => {
      if (section === "syllabus") return r.category === "Syllabus";
      if (section === "pyq") return r.category === "Previous Papers" || r.category === "PYQs";
      return r.category === `Unit ${section}` || r.unit_number === section;
    }));
    setRelated([]); setRelatedTried(false); setEdPlaying(null);
    setLoading(false);
  }, [subjectId, section, isUnit]);
  useEffect(() => { load(); }, [load]);

  const loadRelated = useCallback(async () => {
    setRelatedLoading(true); setRelatedTried(true); setPlayingId(null);
    const topic = `${subjectName ?? "this subject"}${isUnit ? ` — Unit ${section}` : ""}`;
    const { data } = await invokeFn<{ videos: any[] }>("related-videos", { topic });
    setRelated((data?.videos ?? []) as any[]);
    setRelatedLoading(false);
  }, [subjectName, section, isUnit]);

  const sectionTitle = section === "syllabus" ? "Syllabus" : section === "pyq" ? "Previous Year Questions" : `Unit ${section}`;

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-2xl td-surface animate-pulse" />)}</div>;

  // ── Free preview: give non-owners a real taste (first Q&A, first video,
  //    first resource + anything a contributor marked free) so they experience
  //    the quality and want to unlock — instead of hitting a wall of locks. ──
  const preview = !hasAccess;
  const freeQaIds = new Set<string>();
  if (preview) {
    qa.forEach((x) => { if ((x as any).is_free) freeQaIds.add(x.id); });
    if (qa[0]) freeQaIds.add(qa[0].id);
  }
  const freeEdId = preview ? editorial[0]?.id ?? null : null;
  const freeResId = preview ? resources[0]?.id ?? null : null;
  const qaFree = (id: string) => !preview || freeQaIds.has(id);
  const edFree = (id: string) => !preview || id === freeEdId;
  const resFree = (id: string) => !preview || id === freeResId;

  // reusable unlock button for the preview banner / locked teasers
  const UnlockBtn = ({ small }: { small?: boolean }) =>
    inCart ? (
      <span className={`td-accent-bg rounded-full font-semibold inline-flex items-center gap-1.5 ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm"}`}>
        <Check className={small ? "w-3.5 h-3.5" : "w-4 h-4"} /> In cart
      </span>
    ) : (
      <button onClick={onAddToCart} className={`td-btn-primary rounded-full font-semibold inline-flex items-center gap-1.5 ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm"}`}>
        <Plus className={small ? "w-3.5 h-3.5" : "w-4 h-4"} /> Unlock{priceLabel ? ` · ${priceLabel}` : ""}
      </button>
    );

  // a locked teaser row (question/title visible, content sealed behind unlock)
  const LockedCard = ({ title, sub }: { title: string; sub?: string }) => (
    <div className="td-surface rounded-2xl overflow-hidden opacity-95">
      <div className="flex items-center gap-3 px-4 sm:px-5 py-4">
        <span className="shrink-0 w-7 h-7 rounded-lg td-surface-2 flex items-center justify-center"><Lock className="w-3.5 h-3.5 text-zinc-500" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-zinc-400 font-medium truncate">{title}</span>
          {sub && <span className="block text-zinc-600 text-xs">{sub}</span>}
        </span>
        <button onClick={onAddToCart} className="td-btn-ghost px-3 py-1.5 text-xs font-semibold shrink-0 flex items-center gap-1">Unlock <ArrowRight className="w-3 h-3" /></button>
      </div>
    </div>
  );

  // ── Materials — grouped topic-wise inside units, flat elsewhere ──
  const renderResource = (r: ResourceRow) => {
    if (!resFree(r.id)) return <LockedCard key={r.id} title={r.title} sub={r.type} />;
    const Icon = resTypeIcon[r.type] ?? ExternalLink;
    const embed = toEmbedUrl(r.url);
    const open = openMaterial === r.id;
    const free = preview && r.id === freeResId;
    return (
      <div key={r.id} className="td-surface rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl td-surface-2 flex items-center justify-center shrink-0"><Icon className="w-4.5 h-4.5 text-zinc-300" /></div>
          <div className="min-w-0 flex-1"><p className="text-white text-sm font-medium truncate flex items-center gap-2">{r.title}{free && <span className="td-accent-bg text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">FREE</span>}</p><p className="text-zinc-600 text-xs capitalize">{r.type}</p></div>
          {embed && <button onClick={() => { setOpenMaterial(open ? null : r.id); markStudied(subjectId, readinessKey); }} className="td-btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5 shrink-0"><Eye className="w-3.5 h-3.5" /> {open ? "Hide" : "View"}</button>}
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full td-btn-ghost flex items-center justify-center shrink-0" aria-label="Open"><ExternalLink className="w-4 h-4" /></a>
        </div>
        {open && embed && <div className="border-t border-white/5 bg-black/40"><iframe src={embed} title={r.title} className="w-full h-[70vh]" allow="autoplay" allowFullScreen /></div>}
      </div>
    );
  };

  const Materials = () => {
    if (resources.length === 0 && (!isUnit || topics.length === 0)) {
      return <div className="td-surface rounded-2xl p-6 text-center text-zinc-500 text-sm">No materials uploaded yet.</div>;
    }
    if (!isUnit || topics.length === 0) {
      return <div className="space-y-3">{resources.map(renderResource)}</div>;
    }
    return (
      <div className="space-y-5">
        {[...topics.map((t) => ({ gid: t.id as string | null, title: t.title })), { gid: null, title: "General" }]
          .filter((g) => activeTopic === "all" || g.gid === activeTopic)
          .map((group) => {
          const items = resources.filter((r) => (r.topic_id ?? null) === group.gid);
          // topic headings stay visible with a placeholder; General only when it has items
          if (items.length === 0 && group.gid === null) return null;
          return (
            <div key={group.gid ?? "general"} className="space-y-3">
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-zinc-500 flex items-center gap-2 px-1">
                <span className="w-1.5 h-1.5 rounded-full td-accent-solid inline-block" /> {group.title}
              </p>
              {items.length === 0
                ? <div className="td-surface rounded-2xl p-4 text-center text-zinc-600 text-xs">Materials for this topic are coming soon.</div>
                : items.map(renderResource)}
            </div>
          );
        })}
      </div>
    );
  };

  if (!isUnit) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">{sectionTitle}</h2>
        <Materials />
      </div>
    );
  }

  const tabs: { id: UnitTab; label: string; icon: any }[] = [
    { id: "ai", label: "Study With AI", icon: AiIcon },
    { id: "editorial", label: "Editorial", icon: Clapperboard },
    { id: "resources", label: "Resources", icon: Layers },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">{sectionTitle}</h2>
        {/* Topic picker — select a topic to focus on just its content */}
        {topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            <button
              onClick={() => setActiveTopic("all")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${activeTopic === "all" ? "bg-white text-black" : "td-surface-2 text-zinc-300 hover:text-white"}`}
            >
              All topics
            </button>
            {topics.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setActiveTopic(activeTopic === t.id ? "all" : t.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${activeTopic === t.id ? "bg-white text-black" : "td-surface-2 text-zinc-300 hover:text-white"}`}
              >
                <span className={activeTopic === t.id ? "font-bold" : "td-accent-text font-bold"}>{i + 1}.</span> {t.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Free-preview banner — showcase what's free + invite to unlock */}
      {preview && (
        <div className="td-hero rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div aria-hidden className="absolute -top-12 -right-8 w-40 h-36 opacity-45 pointer-events-none"
            style={{ background: "rgb(var(--td-accent-rgb) / 0.22)", borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%", filter: "blur(8px)" }} />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="w-11 h-11 rounded-2xl td-accent-bg flex items-center justify-center shrink-0"><Gift className="w-5 h-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold">You're previewing {subjectName ?? "this subject"} free 🎁</p>
              <p className="text-zinc-400 text-[13px] mt-0.5">The first question, video and resource are on us. Unlock everything — all units, notes, PYQs &amp; Study-With-AI.</p>
            </div>
            <div className="shrink-0"><UnlockBtn /></div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 td-surface rounded-full p-1 w-fit max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3.5 py-2 rounded-full text-[13px] font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${tab === t.id ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Study With AI — grouped topic-wise (topics always visible as structure) */}
      {tab === "ai" && (
        qa.length === 0 && topics.length === 0 ? (
          <div className="td-surface rounded-2xl p-6 text-center text-zinc-500 text-sm">No Q&amp;A added for this unit yet.</div>
        ) : (
          <div className="space-y-5">
            {[...topics.map((t) => ({ gid: t.id as string | null, title: t.title })), { gid: null, title: "General" }]
              .filter((g) => activeTopic === "all" || g.gid === activeTopic)
              .map((group) => {
              const items = qa.filter((x) => ((x as any).topic_id ?? null) === group.gid);
              // topic headings always show (with a placeholder); General only when it has content
              if (items.length === 0 && group.gid === null) return null;
              if (items.length === 0) {
                return (
                  <div key={group.gid} className="space-y-2.5">
                    <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-zinc-500 flex items-center gap-2 px-1">
                      <span className="w-1.5 h-1.5 rounded-full td-accent-solid inline-block" /> {group.title}
                    </p>
                    <div className="td-surface rounded-2xl p-4 text-center text-zinc-600 text-xs">Content for this topic is coming soon.</div>
                  </div>
                );
              }
              return (
                <div key={group.gid ?? "general"} className="space-y-2.5">
                  {topics.length > 0 && (
                    <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-zinc-500 flex items-center gap-2 px-1">
                      <span className="w-1.5 h-1.5 rounded-full td-accent-solid inline-block" /> {group.title}
                    </p>
                  )}
                  {items.map((item, qi) => {
                    // locked in preview → enticing teaser (question shown, answer sealed)
                    if (!qaFree(item.id)) {
                      return (
                        <div key={item.id} className="td-surface rounded-2xl overflow-hidden">
                          <div className="w-full flex items-center gap-3 px-4 sm:px-5 py-4">
                            <span className="shrink-0 w-7 h-7 rounded-lg td-surface-2 flex items-center justify-center"><Lock className="w-3.5 h-3.5 text-zinc-500" /></span>
                            <span className="flex-1 font-medium text-zinc-400 truncate">{item.question}</span>
                            <button onClick={onAddToCart} className="td-btn-ghost px-3 py-1.5 text-xs font-semibold shrink-0 flex items-center gap-1">Unlock <ArrowRight className="w-3 h-3" /></button>
                          </div>
                        </div>
                      );
                    }
                    const open = openId === item.id;
                    const free = preview && freeQaIds.has(item.id);
                    return (
                      <div key={item.id} className={`td-surface rounded-2xl overflow-hidden transition-shadow ${open ? "ring-1 ring-[rgb(var(--td-accent-rgb)/0.35)]" : ""}`}>
                        <button onClick={() => { setOpenId(open ? null : item.id); markStudied(subjectId, readinessKey); }} className="w-full flex items-center gap-3 px-4 sm:px-5 py-4 text-left">
                          <span
                            className="shrink-0 w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center"
                            style={open
                              ? { background: "var(--td-accent)", color: "#fff" }
                              : { background: "rgb(var(--td-accent-rgb) / 0.12)", color: "var(--td-accent)" }}
                          >
                            {qi + 1}
                          </span>
                          <span className={`flex-1 font-medium flex items-center gap-2 ${open ? "text-white" : "text-zinc-200"}`}>
                            {item.question}
                            {free && <span className="td-accent-bg text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">FREE</span>}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                        </button>
                        {open && (
                          <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-white/5">
                            <MarkdownRenderer content={item.answer_md || "_No answer yet._"} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Editorial — topic-grouped mini-YT cards; one compact in-site player */}
      {tab === "editorial" && (
        <div className="space-y-6">
          {/* compact player — plays whichever mini card was tapped */}
          {edPlaying && (() => {
            const e = editorial.find((x) => x.id === edPlaying);
            const em = e ? toEmbedUrl(e.youtube_url) : null;
            if (!e || !em) return null;
            return (
              <div className="td-surface rounded-2xl overflow-hidden max-w-2xl">
                <div className="aspect-video bg-black">
                  <iframe src={`${em}${em.includes("?") ? "&" : "?"}autoplay=1`} title={e.title ?? "Editorial"} className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                </div>
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <p className="text-white text-sm font-semibold truncate">{e.title || "Editorial video"}</p>
                  <button onClick={() => setEdPlaying(null)} className="td-btn-ghost px-3 py-1.5 text-xs shrink-0">Close</button>
                </div>
              </div>
            );
          })()}

          {editorial.length === 0 && topics.length === 0 ? (
            <div className="td-surface rounded-2xl p-6 text-center text-zinc-500 text-sm">No editorial video added for this unit yet.</div>
          ) : (
            <div className="space-y-5">
              {[...topics.map((t) => ({ gid: t.id as string | null, title: t.title })), { gid: null, title: "General" }]
                .filter((g) => activeTopic === "all" || g.gid === activeTopic)
                .map((group) => {
                  const items = editorial.filter((e) => ((e as any).topic_id ?? null) === group.gid);
                  // topic headings stay visible with a placeholder; General only when it has videos
                  if (items.length === 0 && group.gid === null) return null;
                  return (
                    <div key={group.gid ?? "general"} className="space-y-2.5">
                      {topics.length > 0 && (
                        <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-zinc-500 flex items-center gap-2 px-1">
                          <span className="w-1.5 h-1.5 rounded-full td-accent-solid inline-block" /> {group.title}
                        </p>
                      )}
                      {items.length === 0 ? (
                        <div className="td-surface rounded-2xl p-4 text-center text-zinc-600 text-xs">Videos for this topic are coming soon.</div>
                      ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                          {items.map((e) => {
                            const vid = ytId(e.youtube_url);
                            const active = edPlaying === e.id;
                            const locked = !edFree(e.id);
                            const free = preview && e.id === freeEdId;
                            return (
                              <button key={e.id} onClick={() => { if (locked) { onAddToCart?.(); return; } setEdPlaying(active ? null : e.id); markStudied(subjectId, readinessKey); }}
                                className={`td-surface td-card-click rounded-2xl overflow-hidden text-left group ${active ? "ring-2 ring-[var(--td-accent)]" : ""}`}>
                                <div className="relative aspect-video bg-black">
                                  {vid
                                    ? <img src={`https://i.ytimg.com/vi/${vid}/hqdefault.jpg`} alt="" loading="lazy" className={`w-full h-full object-cover ${locked ? "blur-[3px] scale-105 opacity-70" : ""}`} />
                                    : <span className="absolute inset-0 flex items-center justify-center"><Clapperboard className="w-6 h-6 text-zinc-600" /></span>}
                                  <span className="absolute inset-0 flex items-center justify-center">
                                    <span className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                                      {locked ? <Lock className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white fill-white" />}
                                    </span>
                                  </span>
                                  {free && <span className="absolute top-2 left-2 td-accent-bg text-[9px] font-bold px-1.5 py-0.5 rounded-full">FREE</span>}
                                </div>
                                <div className="px-3 py-2.5">
                                  <p className={`text-[13px] font-medium line-clamp-2 ${locked ? "text-zinc-400" : "text-white"}`}>{locked ? "Unlock to watch" : (e.title || "Editorial video")}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* Groq related rail */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2"><AiIcon className="w-4 h-4" /> Similar videos</h3>
              <button onClick={loadRelated} disabled={relatedLoading} className="td-btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-50">
                {relatedLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} {relatedTried ? "Refresh" : "Find with AI"}
              </button>
            </div>
            {/* in-site player when a real video is picked */}
            {playingId && (
              <div className="td-surface rounded-2xl overflow-hidden mb-3">
                <div className="aspect-video bg-black"><iframe src={`https://www.youtube.com/embed/${playingId}?autoplay=1`} title="Now playing" className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>
              </div>
            )}
            {relatedLoading ? (
              <div className="grid sm:grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-2xl td-surface animate-pulse" />)}</div>
            ) : related.length === 0 ? (
              <div className="td-surface rounded-2xl p-5 text-center text-zinc-500 text-sm">{relatedTried ? "No suggestions." : "Tap “Find with AI” for related study videos."}</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {related.map((v, i) => (
                  v.videoId ? (
                    <button key={i} onClick={() => setPlayingId(v.videoId!)}
                      className="td-surface td-card-click rounded-2xl overflow-hidden flex items-stretch gap-3 text-left group">
                      <div className="relative w-28 shrink-0 bg-black">
                        {v.thumbnail && <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />}
                        <span className="absolute inset-0 flex items-center justify-center"><span className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center"><Play className="w-4 h-4 text-white fill-white" /></span></span>
                      </div>
                      <div className="min-w-0 flex-1 py-3 pr-3"><p className="text-white text-sm font-medium line-clamp-2">{v.title}</p>{v.channel && <p className="text-zinc-600 text-xs mt-1">{v.channel}</p>}</div>
                    </button>
                  ) : (
                    <a key={i} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(v.query ?? v.title)}`} target="_blank" rel="noopener noreferrer"
                      className="td-surface td-card-click rounded-2xl p-4 flex items-center gap-3 group">
                      <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0"><Play className="w-4 h-4 text-red-400 fill-red-400" /></div>
                      <div className="min-w-0 flex-1"><p className="text-white text-sm font-medium line-clamp-2">{v.title}</p>{v.channel && <p className="text-zinc-600 text-xs mt-0.5">{v.channel}</p>}</div>
                      <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 shrink-0" />
                    </a>
                  )
                ))}
              </div>
            )}
            <p className="text-zinc-600 text-[11px] mt-2">
              {related.some((v) => v.videoId) ? "Real videos · play in-site (YouTube Data API)." : "AI suggestions · open on YouTube. Add a YouTube Data API key for in-site playback."}
            </p>
          </div>
        </div>
      )}

      {/* Resources */}
      {tab === "resources" && <Materials />}
    </div>
  );
}
