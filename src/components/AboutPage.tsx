import { useEffect, useState } from "react";
import { Zap, Rocket, BrainCircuit, ArrowUpRight, Users, BookOpen, Info } from "lucide-react";
import { tbl, TeamMemberRow } from "@/integrations/supabase/revamp";
import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import Footer from "./Footer";

function Monogram({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "T";
  return (
    <div className="w-16 h-16 rounded-[20px] td-accent-bg flex items-center justify-center">
      <span className="text-2xl font-bold tracking-tight">{initial}</span>
    </div>
  );
}

const PILLARS = [
  {
    icon: Zap, span: "md:col-span-2",
    title: "Centralized architecture",
    desc: "No more digging through scattered chat groups or expired drives. Instant, unified access to structured notes, materials and previous-year questions.",
  },
  {
    icon: BrainCircuit, span: "md:col-span-1",
    title: "Study with AI",
    desc: "Unit-level explanations and answers, mapped to your exact syllabus.",
  },
  {
    icon: Rocket, span: "md:col-span-3",
    title: "Precision utilities",
    desc: "From attendance planning to accurate SGPA estimates — tools that keep your academic performance transparent, no guesswork.",
  },
];

export default function AboutPage() {
  const [team, setTeam] = useState<TeamMemberRow[]>([]);

  useEffect(() => {
    tbl("team_members").select("*").eq("active", true).order("order_index", { ascending: true })
      .then((r: any) => setTeam((r.data ?? []) as TeamMemberRow[]));
  }, []);

  return (
    <AppShell>
      <PageHero
        eyebrow="About"
        eyebrowIcon={Info}
        title={<>Engineered by students, for the students.</>}
        subtitle="Finding reliable study material, tracking attendance and keeping up with syllabus changes was fragmented and frustrating. We built one platform to fix it — fast, structured, and made for exams."
        stats={[
          { label: "Active students", value: "1400+", icon: Users },
          { label: "Subjects covered", value: "15+", icon: BookOpen },
        ]}
      />

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {PILLARS.map((p) => (
          <div key={p.title} className={`${p.span} td-surface rounded-[28px] p-7 sm:p-8`}>
            <div className="w-11 h-11 rounded-2xl td-accent-bg flex items-center justify-center mb-5">
              <p.icon className="w-5 h-5" strokeWidth={1.7} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{p.title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">{p.desc}</p>
          </div>
        ))}
      </div>

      {/* Team */}
      <section className="mb-10">
        <div className="text-center mb-6">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-zinc-500 uppercase mb-1.5">The core team</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Architects of Team Dino</h2>
        </div>

        {team.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {team.map((m) => {
              const roles = m.role.split(/[·,|]/).map((r) => r.trim()).filter(Boolean);
              const card = (
                <div className="h-full td-surface td-card-click rounded-[28px] p-7 flex flex-col items-center text-center">
                  <div className="mb-5">
                    {m.image_url
                      ? <img src={m.image_url} alt={m.name} className="w-16 h-16 rounded-[20px] object-cover border border-white/10" />
                      : <Monogram name={m.name} />}
                  </div>
                  <h3 className="text-white font-bold tracking-tight flex items-center gap-1.5 mb-3">
                    {m.name}
                    {m.link_url && <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />}
                  </h3>
                  {m.bio && <p className="text-zinc-500 text-xs leading-relaxed mb-4">{m.bio}</p>}
                  <div className="flex flex-wrap justify-center gap-1.5 mt-auto">
                    {roles.map((role) => (
                      <span key={role} className="td-surface-2 px-2.5 py-1 rounded-full text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              );
              return m.link_url
                ? <a key={m.id} href={m.link_url} target="_blank" rel="noopener noreferrer" className="block">{card}</a>
                : <div key={m.id}>{card}</div>;
            })}
          </div>
        )}
      </section>

      <Footer />
    </AppShell>
  );
}
