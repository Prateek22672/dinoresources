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

      {/* Mission — a real narrative, not just feature cards */}
      <section className="td-hero relative overflow-hidden rounded-[28px] p-7 sm:p-10 mb-10">
        <div aria-hidden className="absolute -top-20 -right-16 w-80 h-72 opacity-40 pointer-events-none"
          style={{ background: "rgb(var(--td-accent-rgb) / 0.2)", borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%", filter: "blur(10px)" }} />
        <div className="relative z-10 max-w-2xl">
          <p className="td-accent-text text-[11px] font-bold tracking-[0.25em] uppercase mb-3">Why we built this</p>
          <p className="text-white text-xl sm:text-2xl font-bold leading-snug tracking-tight">
            The night before an exam shouldn't be spent hunting for notes across ten WhatsApp groups and dead Drive links.
          </p>
          <p className="text-zinc-400 leading-relaxed mt-4">
            We're students who lived that chaos. So we built the tool we wished we had — one place with the notes, PYQs and AI explanations that match your exact syllabus, plus the calculators and trackers that tell you where you actually stand. Not a bloated LMS. A sharp, affordable companion made for the way exams really work.
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            {["Made by GITAM students", "Affordable by design", "Exam-first, always"].map((v) => (
              <span key={v} className="td-glass px-3 py-1.5 rounded-full text-[12px] font-semibold text-zinc-300">{v}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {PILLARS.map((p, i) => (
          <div key={p.title} className={`${p.span} td-surface rounded-[28px] p-7 sm:p-8 relative overflow-hidden`}>
            <span className="absolute top-5 right-6 text-5xl font-black text-white/[0.04] select-none">0{i + 1}</span>
            <div className="w-11 h-11 rounded-2xl td-accent-bg flex items-center justify-center mb-5 relative z-10">
              <p.icon className="w-5 h-5" strokeWidth={1.7} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight relative z-10">{p.title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xl relative z-10">{p.desc}</p>
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
