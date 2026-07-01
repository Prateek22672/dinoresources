import { useEffect, useState, useMemo, useCallback } from "react";
import { tbl, JobItemRow } from "@/integrations/supabase/revamp";
import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import { MarkdownRenderer } from "@/components/ai/MarkdownRenderer";
import {
  Briefcase, ListChecks, BookOpen, HelpCircle, ExternalLink, ChevronDown, Building2,
} from "lucide-react";

type Sec = "pattern" | "material" | "questions";
const SECTIONS: { id: Sec; label: string; icon: any }[] = [
  { id: "pattern", label: "Pattern", icon: ListChecks },
  { id: "material", label: "Materials", icon: BookOpen },
  { id: "questions", label: "Questions", icon: HelpCircle },
];

export default function Jobs() {
  const [items, setItems] = useState<JobItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<string>("");
  const [sec, setSec] = useState<Sec>("pattern");
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await tbl("job_items").select("*").order("company").order("order_index", { ascending: true });
    const rows = (data ?? []) as JobItemRow[];
    setItems(rows);
    const companies = [...new Set(rows.map((r) => r.company))];
    if (companies[0]) setCompany((c) => c || companies[0]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const companies = useMemo(() => [...new Set(items.map((r) => r.company))], [items]);
  const visible = useMemo(() => items.filter((r) => r.company === company && r.section === sec), [items, company, sec]);

  return (
    <AppShell>
      <PageHero
        eyebrow="Placement Prep"
        eyebrowIcon={Briefcase}
        title="Crack your dream company."
        subtitle="Exam patterns, curated materials and previous questions — organised company by company."
        stats={companies.length ? [{ label: "Companies", value: companies.length, icon: Building2 }] : undefined}
      />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-2xl td-surface animate-pulse" />)}</div>
      ) : companies.length === 0 ? (
        <div className="py-24 text-center td-surface rounded-[32px]">
          <Briefcase className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">Placement content is coming soon.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[240px_1fr] gap-6">
          {/* Company list */}
          <aside className="lg:sticky lg:top-24 self-start">
            <div className="td-surface rounded-3xl p-3 space-y-1">
              <p className="px-3.5 py-1.5 text-[11px] uppercase tracking-wider text-zinc-600 font-semibold">Companies</p>
              {companies.map((c) => (
                <button key={c} onClick={() => setCompany(c)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-left transition-colors ${company === c ? "bg-white text-black" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}>
                  <Building2 className="w-4 h-4 shrink-0" /> {c}
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div className="min-w-0">
            <div className="flex gap-1.5 td-surface rounded-full p-1 w-fit max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden mb-5">
              {SECTIONS.map((s) => (
                <button key={s.id} onClick={() => setSec(s.id)}
                  className={`px-4 py-2 rounded-full text-[13px] font-medium flex items-center gap-1.5 whitespace-nowrap ${sec === s.id ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}>
                  <s.icon className="w-3.5 h-3.5" /> {s.label}
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <div className="td-surface rounded-2xl p-6 text-center text-zinc-500 text-sm">Nothing here yet for {company}.</div>
            ) : (
              <div className="space-y-2.5">
                {visible.map((it) => {
                  const isOpen = open === it.id;
                  return (
                    <div key={it.id} className="td-surface rounded-2xl overflow-hidden">
                      <div className="flex items-center gap-3 px-5 py-4">
                        <button onClick={() => setOpen(isOpen ? null : it.id)} className="flex-1 flex items-center justify-between gap-3 text-left">
                          <span className="text-white font-medium">{it.title}</span>
                          {it.body_md && <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />}
                        </button>
                        {it.url && <a href={it.url} target="_blank" rel="noopener noreferrer" className="td-btn-ghost px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 shrink-0"><ExternalLink className="w-3.5 h-3.5" /> Open</a>}
                      </div>
                      {isOpen && it.body_md && <div className="px-5 pb-5 pt-1 border-t border-white/5"><MarkdownRenderer content={it.body_md} /></div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
