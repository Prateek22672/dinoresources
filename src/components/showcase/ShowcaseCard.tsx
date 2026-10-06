import { Heart, ArrowUpRight, Github } from "lucide-react";
import { type ShowcasePost, categoryLabel, toneFor } from "@/lib/showcase";
import { safeHref } from "@/lib/showcase";

/** Cover image, or a tone gradient with the title's initial when there's none. */
export function ShowcaseCover({ post, className = "" }: { post: Pick<ShowcasePost, "title" | "cover_url">; className?: string }) {
  const [from, to] = toneFor(post.title);
  return post.cover_url ? (
    <img src={safeHref(post.cover_url)} alt="" loading="lazy" className={`object-cover ${className}`} />
  ) : (
    <div className={`flex items-center justify-center ${className}`} style={{ background: `linear-gradient(155deg, ${from}, ${to})` }}>
      <span className="td-on-dark text-5xl font-black drop-shadow" style={{ opacity: 0.9 }}>{post.title.trim().charAt(0).toUpperCase()}</span>
    </div>
  );
}

export function LikeButton({ count, liked, onToggle, size = "md" }: { count: number; liked: boolean; onToggle: () => void; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      className={`group/like shrink-0 rounded-full flex items-center gap-1.5 font-bold transition-all active:scale-90 ${
        size === "sm" ? "h-8 px-2.5 text-[12px]" : "h-10 px-3.5 text-[13px]"
      } ${liked ? "bg-rose-500 td-on-dark" : "td-surface-2 text-zinc-300 hover:text-white"}`}
    >
      <Heart className={`${size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} transition-transform group-hover/like:scale-110 ${liked ? "fill-current" : ""}`} />
      {count}
    </button>
  );
}

/**
 * One post in the grid: cover on top, title and pitch, tags, author, and the
 * like button. The whole card opens the post; the like and link buttons stop
 * propagation so they act on their own.
 */
export default function ShowcaseCard({ post, liked, onLike, onOpen }: {
  post: ShowcasePost; liked: boolean; onLike: () => void; onOpen: () => void;
}) {
  return (
    <article
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(); }}
      className="td-surface td-bento td-card-click overflow-hidden flex flex-col cursor-pointer group"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <ShowcaseCover post={post} className="w-full h-full transition-transform duration-500 group-hover:scale-[1.04]" />
        <span className="absolute top-3 left-3 rounded-full bg-black/45 backdrop-blur td-on-dark text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
          {categoryLabel(post.category)}
        </span>
        {post.featured && (
          <span className="absolute top-3 right-3 rounded-full td-bento-accent text-[10px] font-black uppercase tracking-wider px-2.5 py-1">Featured</span>
        )}
      </div>
      <div className="p-4 sm:p-5 flex-1 flex flex-col gap-3">
        <div className="min-w-0">
          <h3 className="text-white text-[16px] font-bold leading-snug line-clamp-1">{post.title}</h3>
          <p className="text-zinc-400 text-[13px] leading-snug mt-1 line-clamp-2">{post.tagline}</p>
        </div>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((t) => (
              <span key={t} className="td-surface-2 rounded-full px-2 py-0.5 text-[10.5px] font-semibold text-zinc-400">#{t}</span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <span className="min-w-0 flex-1 text-[12px] text-zinc-500 truncate">by <span className="text-zinc-300 font-semibold">{post.author_name ?? "A GITAM student"}</span></span>
          {safeHref(post.repo_url) && (
            <a href={safeHref(post.repo_url)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-full td-surface-2 flex items-center justify-center text-zinc-400 hover:text-white" aria-label="Code">
              <Github className="w-3.5 h-3.5" />
            </a>
          )}
          {safeHref(post.live_url) && (
            <a href={safeHref(post.live_url)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-full td-surface-2 flex items-center justify-center text-zinc-400 hover:text-white" aria-label="Open">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}
          <LikeButton count={post.like_count} liked={liked} onToggle={onLike} size="sm" />
        </div>
      </div>
    </article>
  );
}
