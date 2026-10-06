import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Rocket, Plus, Heart, LayoutGrid, Pencil, Trash2, Clock, CheckCircle2, XCircle, EyeOff, Flame, Award } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import SearchBox, { type SearchItem } from "@/components/ui/SearchBox";
import Footer from "@/components/Footer";
import ShowcaseCard, { ShowcaseCover, LikeButton } from "@/components/showcase/ShowcaseCard";
import ShowcaseSubmit from "@/components/showcase/ShowcaseSubmit";
import ShowcaseDetail from "@/components/showcase/ShowcaseDetail";
import { supabase } from "@/integrations/supabase/client";
import { type ShowcasePost, type ShowcaseCategory, CATEGORIES, sb, trendScore, categoryLabel } from "@/lib/showcase";

type Sort = "trending" | "new" | "liked";

const STATUS: Record<string, { label: string; icon: any; cls: string }> = {
  pending: { label: "In review", icon: Clock, cls: "text-amber-300 bg-amber-500/10" },
  approved: { label: "Live", icon: CheckCircle2, cls: "text-emerald-300 bg-emerald-500/10" },
  rejected: { label: "Not approved", icon: XCircle, cls: "text-rose-300 bg-rose-500/10" },
  hidden: { label: "Hidden by admin", icon: EyeOff, cls: "text-zinc-400 bg-white/5" },
};

/**
 * Campus Showcase — what GITAM students are building. Anyone can browse;
 * signed-in students like and post. Every post is reviewed by an admin before
 * it appears (enforced in the database), and the whole page can be switched
 * off from Admin → Cards & Features.
 */
export default function Showcase() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<ShowcasePost[]>([]);
  const [mine, setMine] = useState<ShowcasePost[]>([]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [cat, setCat] = useState<ShowcaseCategory | "all">("all");
  const [sort, setSort] = useState<Sort>("trending");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"all" | "mine">("all");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [editing, setEditing] = useState<ShowcasePost | null>(null);
  const inFlight = useRef<Set<string>>(new Set());

  const openId = params.get("p");
  const setOpenId = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("p", id); else next.delete("p");
    setParams(next, { replace: true });
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);
    const pub = await sb.from("showcase_posts").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(300);
    if (pub.error) { setMissing(true); setLoading(false); return; }
    setPosts((pub.data ?? []) as ShowcasePost[]);
    if (user) {
      const [own, likes] = await Promise.all([
        sb.from("showcase_posts").select("*").eq("author_id", user.id).order("created_at", { ascending: false }),
        sb.from("showcase_likes").select("post_id").eq("user_id", user.id),
      ]);
      setMine((own.data ?? []) as ShowcasePost[]);
      setLiked(new Set((likes.data ?? []).map((l: { post_id: string }) => l.post_id)));
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggleLike = async (post: ShowcasePost) => {
    if (!userId) { toast("Sign in to like projects"); navigate("/auth"); return; }
    if (post.status !== "approved") { toast("Likes open once the post is live."); return; }
    if (inFlight.current.has(post.id)) return; // a double-tap waits for the first
    inFlight.current.add(post.id);
    const was = liked.has(post.id);
    // optimistic: flip the heart and the count, roll back if the write fails
    const bump = (d: number) => setPosts((ps) => ps.map((p) => (p.id === post.id ? { ...p, like_count: Math.max(0, p.like_count + d) } : p)));
    setLiked((s) => { const n = new Set(s); was ? n.delete(post.id) : n.add(post.id); return n; });
    bump(was ? -1 : 1);
    const { error } = was
      ? await sb.from("showcase_likes").delete().eq("post_id", post.id).eq("user_id", userId)
      : await sb.from("showcase_likes").insert({ post_id: post.id, user_id: userId });
    if (error) {
      setLiked((s) => { const n = new Set(s); was ? n.add(post.id) : n.delete(post.id); return n; });
      bump(was ? 1 : -1);
      toast.error("Couldn't save that like — try again.");
    }
    inFlight.current.delete(post.id);
  };

  const remove = async (p: ShowcasePost) => {
    if (!confirm(`Delete “${p.title}”? This can't be undone.`)) return;
    const { error } = await sb.from("showcase_posts").delete().eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  const startPost = () => {
    if (!userId) { toast("Sign in to share your project"); navigate("/auth"); return; }
    setEditing(null); setSubmitOpen(true);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = posts.filter((p) =>
      (cat === "all" || p.category === cat) &&
      (!q || `${p.title} ${p.tagline} ${p.tags.join(" ")} ${p.author_name ?? ""}`.toLowerCase().includes(q)));
    if (sort === "new") return list;
    if (sort === "liked") return [...list].sort((a, b) => b.like_count - a.like_count);
    return [...list].sort((a, b) => trendScore(b) - trendScore(a));
  }, [posts, cat, sort, query]);

  const featured = posts.find((p) => p.featured) ?? null;
  const totalLikes = posts.reduce((n, p) => n + p.like_count, 0);
  const openPost = posts.find((p) => p.id === openId) ?? mine.find((p) => p.id === openId) ?? null;

  const toItem = (p: ShowcasePost): SearchItem => ({
    id: p.id, label: p.title, sub: p.tagline, meta: <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {p.like_count}</span>,
    lead: <ShowcaseCover post={p} className="w-9 h-9 rounded-xl shrink-0 overflow-hidden text-[10px]" />,
    onSelect: () => setOpenId(p.id),
  });

  return (
    <AppShell>
      <PageHero
        eyebrow="Campus Showcase"
        eyebrowIcon={Rocket}
        title={<>Built by GITAM students.</>}
        subtitle="Projects, startups, research and designs from across campus. Like the ones you love — and show the campus what you've built."
        actions={
          <>
            <button onClick={startPost} className="td-btn-primary px-5 py-3 text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" /> Share your project</button>
            {userId && (
              <button onClick={() => setView(view === "mine" ? "all" : "mine")} className="td-btn-ghost px-5 py-3 text-sm flex items-center gap-1.5">
                {view === "mine" ? <><LayoutGrid className="w-4 h-4" /> All projects</> : <>My posts{mine.length ? ` (${mine.length})` : ""}</>}
              </button>
            )}
          </>
        }
        stats={loading || missing ? undefined : [
          { label: "Projects live", value: posts.length, icon: Rocket },
          { label: "Likes given", value: totalLikes, icon: Heart },
        ]}
      />

      {missing ? (
        <div className="td-surface td-bento p-10 text-center">
          <Rocket className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-white font-semibold">The Showcase is opening soon</p>
          <p className="text-zinc-500 text-sm mt-1">Check back in a little while.</p>
        </div>
      ) : view === "mine" ? (
        /* ── My posts: every status, with the reason when one wasn't approved ── */
        <section className="space-y-3">
          {mine.length === 0 ? (
            <div className="td-surface td-bento p-10 text-center">
              <p className="text-white font-semibold">You haven't posted anything yet</p>
              <button onClick={startPost} className="td-btn-primary px-5 py-2.5 text-sm mt-4 inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> Share your first project</button>
            </div>
          ) : mine.map((p) => {
            const st = STATUS[p.status];
            return (
              <div key={p.id} className="td-surface td-bento p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <ShowcaseCover post={p} className="w-full sm:w-36 aspect-[16/10] rounded-2xl shrink-0 overflow-hidden" />
                <div className="min-w-0 flex-1">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${st.cls}`}><st.icon className="w-3.5 h-3.5" /> {st.label}</span>
                  <p className="text-white font-bold mt-2 truncate">{p.title}</p>
                  <p className="text-zinc-500 text-[13px] truncate">{p.tagline}</p>
                  {p.status === "rejected" && p.reject_reason && <p className="text-rose-300/90 text-[12px] mt-1.5">Reason: {p.reject_reason}</p>}
                  {p.status === "pending" && <p className="text-zinc-500 text-[12px] mt-1.5">An admin will review it soon — you'll see it here when it's live.</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.status === "approved" && <span className="text-zinc-400 text-[13px] font-semibold flex items-center gap-1 mr-1"><Heart className="w-3.5 h-3.5" /> {p.like_count}</span>}
                  <button onClick={() => { setEditing(p); setSubmitOpen(true); }} className="td-btn-ghost h-9 px-3.5 rounded-full text-[12px] font-semibold flex items-center gap-1.5"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                  <button onClick={() => remove(p)} className="w-9 h-9 rounded-full hover:bg-rose-500/15 flex items-center justify-center" aria-label="Delete"><Trash2 className="w-4 h-4 text-rose-400" /></button>
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        <>
          {/* ── Featured ── */}
          {featured && cat === "all" && !query && (
            <div role="button" tabIndex={0} onClick={() => setOpenId(featured.id)} onKeyDown={(e) => { if (e.key === "Enter") setOpenId(featured.id); }}
              className="td-bento td-card-click w-full grid md:grid-cols-[1.1fr_1fr] overflow-hidden text-left mb-6 td-surface cursor-pointer">
              <ShowcaseCover post={featured} className="w-full h-full min-h-[220px]" />
              <div className="p-6 sm:p-8 flex flex-col justify-center gap-3">
                <span className="td-bento-accent self-start rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"><Award className="w-3 h-3" /> Featured</span>
                <h2 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">{featured.title}</h2>
                <p className="text-zinc-400">{featured.tagline}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-zinc-500 text-[13px] flex-1">by <span className="text-zinc-300 font-semibold">{featured.author_name}</span> · {categoryLabel(featured.category)}</span>
                  <LikeButton count={featured.like_count} liked={liked.has(featured.id)} onToggle={() => toggleLike(featured)} />
                </div>
              </div>
            </div>
          )}

          {/* ── Controls ── */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
            <div className="flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden -mx-1 px-1 flex-1">
              {[{ id: "all" as const, label: "All" }, ...CATEGORIES].map((c) => (
                <button key={c.id} onClick={() => setCat(c.id)}
                  className={`shrink-0 rounded-full px-3.5 h-9 text-[13px] font-semibold transition-colors ${cat === c.id ? "bg-white text-black" : "td-surface-2 text-zinc-400 hover:text-white"}`}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <div className="td-surface rounded-full p-1 flex gap-1 shrink-0">
                {([["trending", "Trending", Flame], ["new", "New", Clock], ["liked", "Most liked", Heart]] as const).map(([id, label, Icon]) => (
                  <button key={id} onClick={() => setSort(id)}
                    className={`rounded-full px-3 h-8 text-[12px] font-semibold flex items-center gap-1.5 transition-colors ${sort === id ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}>
                    <Icon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
              <SearchBox className="w-full lg:w-64" value={query} onChange={setQuery} placeholder="Search projects…"
                items={visible.map(toItem)} idleItems={[]} shortcut={false} emptyText="No project matches" />
            </div>
          </div>

          {/* ── Grid ── */}
          {loading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-80 td-surface td-bento animate-pulse" />)}
            </div>
          ) : visible.length === 0 ? (
            <div className="td-surface td-bento p-10 text-center">
              <Rocket className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-white font-semibold">{posts.length === 0 ? "Be the first to launch something" : "Nothing matches that"}</p>
              <p className="text-zinc-500 text-sm mt-1">{posts.length === 0 ? "Post your project — once it's approved, the whole campus can see it." : "Try another category or search."}</p>
              {posts.length === 0 && <button onClick={startPost} className="td-btn-primary px-5 py-2.5 text-sm mt-4 inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> Share your project</button>}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {visible.map((p) => (
                <ShowcaseCard key={p.id} post={p} liked={liked.has(p.id)} onLike={() => toggleLike(p)} onOpen={() => setOpenId(p.id)} />
              ))}
            </div>
          )}
        </>
      )}

      {userId && (
        <ShowcaseSubmit open={submitOpen} onClose={() => setSubmitOpen(false)} userId={userId} editing={editing}
          onSaved={() => { setView("mine"); load(); }} />
      )}
      <ShowcaseDetail post={openPost} liked={!!openPost && liked.has(openPost.id)}
        onLike={() => openPost && toggleLike(openPost)} onClose={() => setOpenId(null)} />

      <Footer />
    </AppShell>
  );
}
