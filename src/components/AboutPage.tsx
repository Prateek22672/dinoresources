import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, Users, BookOpen, Info, FileText, Star, BrainCircuit, Calculator, Layers, ShieldCheck, ArrowRight, ChevronDown,
} from "lucide-react";
import { tbl, TeamMemberRow } from "@/integrations/supabase/revamp";
import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import AgentCoderFeature from "@/components/brand/AgentCoderFeature";
import Footer from "./Footer";
import fyxLogo from "@/assets/fyx.png";
import { ABOUT_FAQ as FAQ } from "@/data/seo";

function Monogram({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "T";
  return (
    <div className="w-16 h-16 rounded-full td-bento-accent flex items-center justify-center">
      <span className="text-2xl font-extrabold tracking-tight">{initial}</span>
    </div>
  );
}

// What a student actually gets — the order follows what they come for first.
const INSIDE = [
  { icon: FileText, title: "Notes & material", desc: "Unit-wise notes and files for every subject, curated by seniors who sat the same exams — in one place instead of ten WhatsApp groups.", span: "lg:col-span-2", tile: "td-bento-accent" },
  { icon: Star, title: "Important questions", desc: "The questions that keep coming back, picked out unit by unit.", span: "", tile: "td-bento-deep" },
  { icon: Layers, title: "Previous year papers", desc: "Real GITAM PYQs, organised by subject, so you revise what's actually asked.", span: "", tile: "td-surface" },
  { icon: BrainCircuit, title: "Rex, the AI tutor", desc: "Rex reads your subject's uploaded material and explains from it — with the file and page it came from. Not generic internet answers.", span: "lg:col-span-2", tile: "td-bento-ink td-force-dark" },
  { icon: Calculator, title: "Free calculators", desc: "SGPA, CGPA predictor and attendance planner on the GITAM grade chart. No login, free forever.", span: "lg:col-span-2", tile: "td-surface" },
  { icon: ShieldCheck, title: "Fair, one-time pricing", desc: "Pay once per subject or take the full-year pack. No subscription.", span: "", tile: "td-surface" },
];


export default function AboutPage() {
  const [team, setTeam] = useState<TeamMemberRow[]>([]);
  const [open, setOpen] = useState<number | null>(0);

  useEffect(() => {
    tbl("team_members").select("*").eq("active", true).order("order_index", { ascending: true })
      .then((r: any) => setTeam((r.data ?? []) as TeamMemberRow[]));
  }, []);

  const sectionHead = (eyebrow: string, title: string) => (
    <div className="mb-5 px-0.5">
      <p className="text-[11px] font-semibold tracking-[0.25em] text-zinc-500 uppercase mb-1.5">{eyebrow}</p>
      <h2 className="text-2xl sm:text-[1.9rem] font-extrabold tracking-tight text-white leading-tight">{title}</h2>
    </div>
  );

  return (
    <AppShell>
      <PageHero
        eyebrow="About Team Dino"
        eyebrowIcon={Info}
        title={<>Built by GITAM students, for every GITAM student.</>}
        subtitle="Notes, important questions, previous year papers and an AI tutor that reads your syllabus — the study kit we wished we'd had the night before our own exams."
        actions={
          <>
            <Link to="/store" className="td-btn-primary px-5 py-3 text-sm flex items-center gap-1.5">Explore subjects <ArrowRight className="w-3.5 h-3.5" /></Link>
            <Link to="/sgpa-calc" className="td-btn-ghost px-5 py-3 text-sm flex items-center gap-1.5">Free SGPA calculator</Link>
          </>
        }
        stats={[
          { label: "Students signed up", value: "1500+", icon: Users },
          { label: "Subjects covered", value: "15+", icon: BookOpen },
        ]}
      />

      {/* ── Story ── */}
      <section className="grid lg:grid-cols-12 gap-3 sm:gap-4 mb-12">
        <div className="td-surface td-bento lg:col-span-7 p-7 sm:p-9">
          <p className="td-accent-text text-[11px] font-bold tracking-[0.25em] uppercase mb-3">Why we built this</p>
          <p className="text-white text-xl sm:text-2xl font-bold leading-snug tracking-tight">
            The night before an exam shouldn't be spent hunting for notes across ten WhatsApp groups and dead Drive links.
          </p>
          <p className="text-zinc-400 leading-relaxed mt-4">
            We're students who lived that chaos. So we built one place with the notes, important questions and previous papers for your exact syllabus,
            an AI tutor that explains from that material, and the calculators that tell you where you actually stand. Not a bloated LMS —
            a sharp, affordable companion made for the way exams really work.
          </p>
        </div>
        <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4">
          {[
            { k: "01", t: "Find it", d: "Pick your year — your subjects, notes and papers are all there." },
            { k: "02", t: "Understand it", d: "Stuck? Ask Rex. He explains from your own material." },
            { k: "03", t: "Practise it", d: "Important questions and PYQs, unit by unit." },
            { k: "04", t: "Track it", d: "SGPA and attendance, without the guesswork." },
          ].map((s, i) => (
            <div key={s.k} className={`td-bento p-4 sm:p-5 flex flex-col justify-between min-h-[140px] ${i === 0 ? "td-bento-accent" : i === 3 ? "td-bento-ink td-force-dark" : "td-surface"}`}>
              <span className={`text-[26px] font-extrabold leading-none ${i === 0 || i === 3 ? "opacity-60" : "text-zinc-600"}`}>{s.k}</span>
              <span>
                <span className={`block text-[15px] font-bold ${i === 0 || i === 3 ? "" : "text-white"}`}>{s.t}</span>
                <span className={`block text-[12px] mt-1 leading-snug ${i === 0 || i === 3 ? "opacity-70" : "text-zinc-500"}`}>{s.d}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── What's inside ── */}
      <section className="mb-12">
        {sectionHead("What's inside", "Everything for your exams, in one place")}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {INSIDE.map((f) => {
            const filled = f.tile !== "td-surface";
            return (
              <div key={f.title} className={`td-bento ${f.tile} ${f.span} p-6 flex flex-col gap-4 min-h-[180px]`}>
                <span className={`w-11 h-11 rounded-full flex items-center justify-center ${filled ? "bg-white/20" : "td-accent-bg"}`}>
                  <f.icon className="w-5 h-5" strokeWidth={1.8} />
                </span>
                <span>
                  <h3 className={`text-lg font-bold tracking-tight ${filled ? "" : "text-white"}`}>{f.title}</h3>
                  <p className={`text-sm leading-relaxed mt-1.5 ${filled ? "opacity-75" : "text-zinc-400"}`}>{f.desc}</p>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── The Dino universe ── */}
      <section className="mb-12">
        {sectionHead("The Dino universe", "Free tools from the same team")}
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-3 sm:gap-4">
          <AgentCoderFeature variant="app" />
          <a href="https://www.foliofyx.in" target="_blank" rel="noopener noreferrer"
            className="td-bento td-bento-ink td-force-dark td-card-click p-7 flex flex-col justify-between gap-6 group">
            <span className="flex items-start justify-between">
              <img src={fyxLogo} alt="FolioFYX" className="h-7 w-auto max-w-[170px] object-contain object-left" style={{ filter: "brightness(0) invert(1)" }} />
              <ArrowUpRight className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
            </span>
            <span>
              <span className="block text-xl font-bold">Your portfolio site, in minutes</span>
              <span className="block text-sm opacity-65 mt-1.5 leading-relaxed">Placements don't wait for perfect. Build a standout portfolio and share one link.</span>
            </span>
            <span className="text-[11px] font-black tracking-[0.18em] uppercase opacity-60">foliofyx.in</span>
          </a>
        </div>
      </section>

      {/* ── Team ── */}
      {team.length > 0 && (
        <section className="mb-12">
          {sectionHead("The core team", "The people behind Team Dino")}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {team.map((m) => {
              const roles = m.role.split(/[·,|]/).map((r) => r.trim()).filter(Boolean);
              const card = (
                <div className="h-full td-surface td-bento td-card-click p-7 flex flex-col items-center text-center">
                  <div className="mb-5">
                    {m.image_url
                      ? <img src={m.image_url} alt={`${m.name}, Team Dino`} loading="lazy" className="w-16 h-16 rounded-full object-cover border border-white/10" />
                      : <Monogram name={m.name} />}
                  </div>
                  <h3 className="text-white font-bold tracking-tight flex items-center gap-1.5 mb-3">
                    {m.name}
                    {m.link_url && <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />}
                  </h3>
                  {m.bio && <p className="text-zinc-500 text-xs leading-relaxed mb-4">{m.bio}</p>}
                  <div className="flex flex-wrap justify-center gap-1.5 mt-auto">
                    {roles.map((role) => (
                      <span key={role} className="td-surface-2 px-2.5 py-1 rounded-full text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">{role}</span>
                    ))}
                  </div>
                </div>
              );
              return m.link_url
                ? <a key={m.id} href={m.link_url} target="_blank" rel="noopener noreferrer" className="block">{card}</a>
                : <div key={m.id}>{card}</div>;
            })}
          </div>
        </section>
      )}

      {/* ── FAQ (also published as FAQPage structured data — see App.tsx) ── */}
      <section className="mb-4 max-w-3xl">
        {sectionHead("Questions", "Asked about Team Dino")}
        <div className="space-y-2">
          {FAQ.map((f, i) => (
            <div key={f.q} className="td-surface rounded-2xl overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left" aria-expanded={open === i}>
                <h3 className="text-white font-semibold text-[15px]">{f.q}</h3>
                <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && <p className="px-5 pb-5 text-zinc-400 text-sm leading-relaxed">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </AppShell>
  );
}

