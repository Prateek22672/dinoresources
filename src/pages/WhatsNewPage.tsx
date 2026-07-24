import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import { FEATURES, FEATURE_CATEGORIES, Role } from "@/data/features";
import { useUserRole } from "@/hooks/useUserRole";
import { Sparkles, PlayCircle } from "lucide-react";

const ROLE_LABEL: Record<Role, { label: string; cls: string }> = {
  student: { label: "Students", cls: "bg-white/10 text-zinc-300" },
  contributor: { label: "Contributors", cls: "bg-amber-500/15 text-amber-300" },
  admin: { label: "Admins", cls: "td-accent-bg" },
};

export default function WhatsNewPage() {
  const { isAdmin, isContributor } = useUserRole();
  const [onlyNew, setOnlyNew] = useState(false);

  // show features relevant to the viewer's role (admins/contributors see all)
  const canSee = (roles: Role[]) =>
    isAdmin || (isContributor && (roles.includes("contributor") || roles.includes("student"))) || roles.includes("student");

  const visible = FEATURES.filter((f) => canSee(f.roles) && (!onlyNew || f.isNew));

  return (
    <AppShell>
      <PageHero
        eyebrow="#TheNewTeamDino"
        eyebrowIcon={Sparkles}
        title="Everything TeamDino can do"
        subtitle="A quick tour of every feature — what it is and where to find it. New here? You've got more tools than you think."
        book={{ cover: "#7c6cf0", spine: "#5b4fc4", title: "NEW" }}
        actions={
          <>
            <button onClick={() => window.dispatchEvent(new Event("td:open-tour"))}
              className="td-btn-primary rounded-full h-11 px-5 text-sm font-semibold flex items-center gap-2">
              <PlayCircle className="w-4 h-4" /> Take the 30-sec tour
            </button>
            <button onClick={() => setOnlyNew((v) => !v)}
              className={`rounded-full h-11 px-5 text-sm font-semibold transition-colors ${onlyNew ? "bg-white text-black" : "td-btn-ghost"}`}>
              {onlyNew ? "Showing new only" : "Show what's new"}
            </button>
          </>
        }
      />

      <div className="space-y-9">
        {FEATURE_CATEGORIES.map((cat) => {
          const items = visible.filter((f) => f.category === cat);
          if (items.length === 0) return null;
          return (
            <section key={cat}>
              <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full td-accent-solid inline-block" /> {cat}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {items.map((f) => (
                  <div key={f.name} className="td-surface rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-white font-semibold leading-snug">{f.name}</p>
                      {f.isNew && <span className="td-accent-bg text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">NEW</span>}
                    </div>
                    <p className="text-zinc-400 text-[13px] leading-relaxed">{f.desc}</p>
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-zinc-500 text-[12px] leading-relaxed">
                        <span className="td-accent-text font-semibold">How: </span>{f.how}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {f.roles.map((r) => (
                        <span key={r} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_LABEL[r].cls}`}>{ROLE_LABEL[r].label}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
