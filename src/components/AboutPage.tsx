import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Zap, Rocket, BrainCircuit, ArrowUpRight } from "lucide-react";
import { tbl, TeamMemberRow } from "@/integrations/supabase/revamp";

import dinoWhite from "@/assets/dinosaurWhite.png";
import Footer from "./Footer";

function Monogram({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "T";
  return (
    <div className="w-16 h-16 rounded-[20px] bg-white/[0.04] border border-white/10 flex items-center justify-center">
      <span className="text-2xl font-light text-zinc-200 tracking-tight">{initial}</span>
    </div>
  );
}

export default function AboutPage() {
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamMemberRow[]>([]);

  useEffect(() => {
    tbl("team_members").select("*").eq("active", true).order("order_index", { ascending: true })
      .then((r: any) => setTeam((r.data ?? []) as TeamMemberRow[]));
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-white/20 flex flex-col relative overflow-hidden">
      {/* tech grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[480px] bg-[#7c6cf0]/[0.06] rounded-full blur-[130px] pointer-events-none z-0" />

      {/* header */}
      <header className="border-b border-white/5 bg-[#09090b]/60 backdrop-blur-2xl sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}
            className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-full h-10 w-10">
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
          </Button>
          <h1 className="text-xs font-medium tracking-[0.15em] text-zinc-300 uppercase">Team Dino</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 sm:py-24 max-w-5xl flex-1 relative z-10 -mt-16">
        {/* hero */}
        <div className="text-center space-y-6 mb-28 animate-in slide-in-from-bottom-8 fade-in duration-1000 fill-mode-both">
          <div className="flex justify-center mb-9">
            <div className="w-20 h-20 opacity-80 animate-[aboutFloat_6s_ease-in-out_infinite]">
              <img src={dinoWhite} alt="Team Dino" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/8 text-zinc-400 text-[10px] font-medium tracking-[0.2em] uppercase">
            About the workspace
          </div>

          <h2 className="pb-2 text-4xl font-light leading-[1.12] tracking-tight text-white sm:text-6xl">
            Engineered by students, <br className="hidden sm:block" />
            <span className="font-medium text-zinc-300"
              style={{ backgroundSize: "200% auto", animation: "aboutGradient 6s linear infinite" }}>
              for the students.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-400/80 max-w-2xl mx-auto leading-relaxed font-light mt-6">
            Finding reliable study material, tracking attendance, and keeping up with syllabus changes was
            fragmented and frustrating. We built one platform to fix it — fast, structured, and made for exams.
          </p>
        </div>

        {/* feature bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-28 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-200 fill-mode-both">
          <div className="md:col-span-2 group bg-[#121214]/60 border border-white/5 rounded-[32px] p-10 hover:border-white/12 transition-colors relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-6 border border-white/8">
              <Zap className="w-5 h-5 text-zinc-200" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-medium text-zinc-100 mb-3 tracking-wide">Centralized architecture</h3>
            <p className="text-zinc-400/80 text-sm sm:text-base leading-relaxed max-w-md font-light">
              No more digging through scattered chat groups or expired drives. Instant, unified access to
              structured notes, materials and previous-year questions.
            </p>
          </div>

          <div className="md:col-span-1 group bg-[#121214]/60 border border-white/5 rounded-[32px] p-10 hover:border-white/12 transition-colors relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-6 border border-white/8">
              <BrainCircuit className="w-5 h-5 td-accent-text" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-medium text-zinc-100 mb-3 tracking-wide">Study with AI</h3>
            <p className="text-zinc-400/80 text-sm sm:text-base leading-relaxed font-light">
              Unit-level explanations and answers, mapped to your exact syllabus.
            </p>
          </div>

          <div className="md:col-span-3 group bg-[#121214]/60 border border-white/5 rounded-[32px] p-10 hover:border-white/12 transition-colors relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-6 border border-white/8">
              <Rocket className="w-5 h-5 text-zinc-200" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-medium text-zinc-100 mb-3 tracking-wide">Precision utilities</h3>
            <p className="text-zinc-400/80 text-sm sm:text-base leading-relaxed max-w-2xl font-light">
              From attendance planning to accurate SGPA estimates — tools that keep your academic
              performance transparent, no guesswork.
            </p>
          </div>
        </div>

        {/* team */}
        <div className="space-y-14 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-300 fill-mode-both">
          <div className="text-center space-y-3">
            <h2 className="text-[10px] font-medium tracking-[0.25em] text-zinc-500 uppercase">The core team</h2>
            <p className="text-2xl font-light text-zinc-100 tracking-wide">Architects of Team Dino</p>
          </div>

          {team.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {team.map((m) => {
                const roles = m.role.split(/[·,|]/).map((r) => r.trim()).filter(Boolean);
                const card = (
                  <div className="h-full bg-[#121214]/40 border border-white/5 rounded-[32px] p-8 flex flex-col items-center text-center transition-all duration-500 hover:border-white/12 hover:-translate-y-1 relative overflow-hidden">
                    <div className="relative z-10 mb-6">
                      {m.image_url
                        ? <img src={m.image_url} alt={m.name} className="w-16 h-16 rounded-[20px] object-cover border border-white/10" />
                        : <Monogram name={m.name} />}
                    </div>
                    <h3 className="text-lg font-medium text-zinc-100 mb-5 relative z-10 tracking-wide flex items-center gap-1.5">
                      {m.name}
                      {m.link_url && <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />}
                    </h3>
                    {m.bio && <p className="text-zinc-500 text-xs leading-relaxed mb-5 font-light">{m.bio}</p>}
                    <div className="flex flex-wrap justify-center gap-2 mt-auto relative z-10">
                      {roles.map((role) => (
                        <span key={role} className="px-3 py-1.5 rounded-md bg-white/5 border border-white/5 text-zinc-400/90 text-[10px] font-medium uppercase tracking-widest">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                );
                return m.link_url
                  ? <a key={m.id} href={m.link_url} target="_blank" rel="noopener noreferrer" className="group block">{card}</a>
                  : <div key={m.id} className="group">{card}</div>;
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes aboutGradient { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes aboutFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}} />
    </div>
  );
}
