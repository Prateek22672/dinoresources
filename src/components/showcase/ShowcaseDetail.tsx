import { ArrowUpRight, Github, Users, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { type ShowcasePost, categoryLabel, ago } from "@/lib/showcase";
import { safeHref } from "@/lib/showcase";
import { ShowcaseCover, LikeButton } from "./ShowcaseCard";

/** Full post: big cover, the story, links, team, and the like button. */
export default function ShowcaseDetail({ post, liked, onLike, onClose }: {
  post: ShowcasePost | null; liked: boolean; onLike: () => void; onClose: () => void;
}) {
  const share = async () => {
    if (!post) return;
    const url = `${window.location.origin}/showcase?p=${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: post.title, text: post.tagline, url });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    } catch { /* share sheet dismissed */ }
  };

  return (
    <Dialog open={!!post} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="td-surface rounded-[28px] border border-white/10 max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        {post && (
          <>
            <ShowcaseCover post={post} className="w-full aspect-[16/8]" />
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold tracking-[0.2em] uppercase td-accent-text">{categoryLabel(post.category)}{post.featured ? " · Featured" : ""}</p>
                  <DialogTitle className="text-white text-2xl sm:text-[2rem] font-extrabold tracking-tight leading-tight mt-1">{post.title}</DialogTitle>
                  <DialogDescription className="text-zinc-400 text-[15px] mt-1.5">{post.tagline}</DialogDescription>
                </div>
                <LikeButton count={post.like_count} liked={liked} onToggle={onLike} />
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-5">
                {safeHref(post.live_url) && (
                  <a href={safeHref(post.live_url)} target="_blank" rel="noopener noreferrer" className="td-btn-primary h-10 px-4 rounded-full text-[13px] font-bold flex items-center gap-1.5">
                    Visit <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                )}
                {safeHref(post.repo_url) && (
                  <a href={safeHref(post.repo_url)} target="_blank" rel="noopener noreferrer" className="td-btn-ghost h-10 px-4 rounded-full text-[13px] font-semibold flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5" /> Code
                  </a>
                )}
                <button onClick={share} className="td-btn-ghost h-10 px-4 rounded-full text-[13px] font-semibold flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
              </div>

              {post.description && (
                <p className="text-zinc-300 text-[15px] leading-relaxed mt-6 whitespace-pre-line">{post.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-6 pt-5 border-t border-white/10 text-[12px] text-zinc-500">
                <span>by <span className="text-zinc-300 font-semibold">{post.author_name ?? "A GITAM student"}</span></span>
                {post.team && <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {post.team}</span>}
                <span>{ago(post.approved_at ?? post.created_at)}</span>
                {post.tags.map((t) => <span key={t} className="td-surface-2 rounded-full px-2 py-0.5 font-semibold text-zinc-400">#{t}</span>)}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
