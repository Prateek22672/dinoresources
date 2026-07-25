import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { tbl, SubjectRow } from "@/integrations/supabase/revamp";
import { useAccess } from "@/hooks/useAccess";
import { useCart } from "@/context/CartContext";
import { formatPaise } from "@/lib/money";
import { setRecentSubject } from "@/lib/recent";
import AppShell from "@/components/layout/AppShell";
import UnitView from "@/components/subject/UnitView";
import {
  FileText, Lock, BookOpen, FileQuestion, ChevronLeft, Plus, Check, Maximize2, Minimize2,
} from "lucide-react";

type Section = "syllabus" | "pyq" | number; // number = unit 1..5

const UNIT_NUMBERS = [1, 2, 3, 4, 5];

export default function SubjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addSubject, isInCart } = useCart();

  const [subject, setSubject] = useState<SubjectRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>(1);
  const [focus, setFocus] = useState(false);

  const { hasAccess, loading: accessLoading, refresh: refreshAccess } =
    useAccess(subject?.id ?? null, subject?.year_id ?? null);

  const load = useCallback(async () => {
    setLoading(true);
    // slug may be a slug or a raw id
    let { data } = await tbl("subjects").select("*").eq("slug", slug).maybeSingle();
    if (!data) {
      const byId = await tbl("subjects").select("*").eq("id", slug).maybeSingle();
      data = byId.data;
    }
    const s = (data as SubjectRow) ?? null;
    setSubject(s);
    if (s) setRecentSubject(s.slug ?? String(s.id), s.name);
    setLoading(false);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <AppShell><div className="h-64 rounded-3xl td-surface animate-pulse" /></AppShell>;
  }
  if (!subject) {
    return (
      <AppShell>
        <div className="py-24 text-center td-surface rounded-[32px]">
          <p className="text-zinc-400">Subject not found.</p>
          <button onClick={() => navigate("/store")} className="td-btn-primary px-5 py-2.5 mt-4 text-sm">Back to Store</button>
        </div>
      </AppShell>
    );
  }

  const navButton = (id: Section, label: string, Icon: any) => {
    const active = section === id;
    return (
      <button
        key={String(id)}
        onClick={() => setSection(id)}
        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
          active ? "bg-white text-black" : "text-zinc-400 hover:text-white hover:bg-white/5"
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </button>
    );
  };

  return (
    <AppShell hideHeader={focus}>
      <div className="flex items-center justify-between gap-3 mb-5">
        <Link to="/library" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <button
          onClick={() => setFocus((f) => !f)}
          className="td-btn-ghost px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5"
          title={focus ? "Show header" : "Hide header (focus mode)"}
        >
          {focus ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          {focus ? "Show header" : "Focus mode"}
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{subject.name}</h1>
        {subject.description && <p className="text-zinc-500 mt-1">{subject.description}</p>}
      </div>

      <div className="grid lg:grid-cols-[260px_minmax(0,1fr)] gap-6">
        {/* Left nav */}
        <aside className="lg:sticky lg:top-24 self-start">
          <div className="td-surface rounded-3xl p-3 space-y-1">
            {navButton("syllabus", "Syllabus", FileText)}
            <div className="px-3.5 py-1.5 text-[11px] uppercase tracking-wider text-zinc-600 font-semibold">Units</div>
            {UNIT_NUMBERS.map((n) => navButton(n, `Unit ${n}`, BookOpen))}
            {navButton("pyq", "PYQs", FileQuestion)}
          </div>
        </aside>

        {/* Content — always shown, with a free preview for non-owners so they
            can taste the quality (first Q&A, video & resource) and unlock. */}
        <div className="min-w-0">
          <UnitView
            subjectId={subject.id}
            subjectName={subject.name}
            section={section}
            onSection={setSection}
            hasAccess={hasAccess}
            onUnlock={refreshAccess}
            priceLabel={formatPaise(subject.price_paise)}
            inCart={isInCart("subject", subject.id)}
            onAddToCart={() => (isInCart("subject", subject.id) ? navigate("/cart") : addSubject(subject.id, subject.name))}
          />
        </div>
      </div>
    </AppShell>
  );
}
