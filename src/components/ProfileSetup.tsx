import { useState, useEffect } from "react";
import { resolveStudentYear } from "@/lib/year";
import { tbl, type YearRow } from "@/integrations/supabase/revamp";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BookOpen, GraduationCap, ArrowRight, User, AtSign, Mail, LogOut, Receipt, LibraryBig, Sparkles, Check, ArrowUpRight } from "lucide-react";
import AppShell from "@/components/layout/AppShell";

const DEPARTMENTS = ["CSE", "ECE", "Mechanical Engineering"];
const academicOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Supplementary"];

interface ProfileSetupProps {
  onProfileUpdated?: () => void;
}

/** The saved values, so we can tell whether anything actually changed. */
interface Snapshot { fullName: string; username: string; department: string; semester: string }
const EMPTY: Snapshot = { fullName: "", username: "", department: "", semester: "" };

export default function ProfileSetup({ onProfileUpdated }: ProfileSetupProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [saved, setSaved] = useState<Snapshot>(EMPTY);
  // Year choices come from the years that are switched ON in admin; the
  // fixed list is only a fallback if they can't be read.
  const [yearOptions, setYearOptions] = useState<string[]>(academicOptions);
  const [closedYear, setClosedYear] = useState<string | null>(null);

  useEffect(() => { loadCurrentProfile(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const loadCurrentProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setEmail(user.email ?? "");

    const { data } = await supabase
      .from("profiles")
      .select("department, semester, full_name, username" as "department, semester")
      .eq("id", user.id)
      .single();

    const { data: yrs } = await tbl("years").select("*").eq("active", true).order("order_index", { ascending: true });
    const active = (yrs ?? []) as YearRow[];
    if (active.length) setYearOptions(active.map((y) => y.name));

    if (data) {
      const d = data as any;
      const snap: Snapshot = {
        department: d.department || "",
        semester: d.semester?.toString() || "",
        fullName: d.full_name || "",
        username: d.username || "",
      };
      setDepartment(snap.department);
      setSemester(snap.semester);
      // Their saved year is switched off (e.g. only Supplementary is open):
      // pre-select the open year so the choice is already made — they just
      // save. The rest of the app already shows them that year meanwhile.
      if (snap.semester && active.length) {
        const r = resolveStudentYear(snap.semester, active);
        const pick = r.fallback ? active.find((y) => y.id === r.id) : null;
        if (pick) { setSemester(pick.name); setClosedYear(snap.semester); }
      }
      setFullName(snap.fullName);
      setUsername(snap.username);
      setSaved(snap);
    }
    setIsLoading(false);
  };

  const current: Snapshot = { fullName, username, department, semester };
  const dirty = (Object.keys(current) as (keyof Snapshot)[]).some((k) => current[k] !== saved[k]);
  const canSave = dirty && !!department && !!semester && !isSaving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not authenticated"); setIsSaving(false); return; }

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, "");
    const { error } = await supabase
      .from("profiles")
      .update({
        department,
        semester,
        full_name: fullName.trim() || null,
        username: cleanUsername || null,
      } as any)
      .eq("id", user.id);

    setIsSaving(false);
    if (error) {
      toast.error(error.message ?? "Failed to update profile");
      return;
    }
    // Keep the form in sync with what's now stored, so the page settles into a
    // clean state instead of still looking unsaved.
    setUsername(cleanUsername);
    setSaved({ fullName: fullName.trim(), username: cleanUsername, department, semester });
    toast.success("Profile updated!");
    onProfileUpdated?.();
    navigate("/");
  };

  const signOut = async () => { await supabase.auth.signOut(); navigate("/auth"); };

  const initial = (fullName || username || email || "?").trim().charAt(0).toUpperCase();

  const iconCls = "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 z-10";
  const inputCls =
    "w-full h-12 td-surface-2 rounded-xl pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 td-field-focus";
  const labelCls = "text-zinc-400 text-xs font-medium pl-1";
  const cardCls = "td-surface td-bento p-6 sm:p-7 space-y-4";
  const sectionCls = "text-[11px] font-semibold tracking-[0.18em] uppercase text-zinc-500";

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-5xl space-y-5">
          <div className="h-28 rounded-[28px] td-surface animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-2xl td-surface animate-pulse" />)}
          </div>
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="h-72 rounded-[28px] td-surface animate-pulse" />
            <div className="h-72 rounded-[28px] td-surface animate-pulse" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <style>{`
        .td-field-focus:focus, .td-field-focus:focus-within {
          border-color: rgb(var(--td-accent-rgb) / 0.55) !important;
          box-shadow: 0 0 0 3px rgb(var(--td-accent-rgb) / 0.16);
        }
      `}</style>

      <div className="max-w-5xl">
        {/* Identity + quick links as one bento row, matching the dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 mb-5 td-in">
          <div className="td-bento td-bento-accent relative overflow-hidden col-span-2 lg:col-span-6 lg:row-span-2 p-6 sm:p-7 flex flex-col justify-between gap-6 min-h-[200px]">
            <span aria-hidden className="absolute -right-12 -bottom-16 w-[190px] h-[190px] rounded-full td-bento-sphere hidden sm:block" />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="w-14 h-14 rounded-full bg-[#0d0d0d] text-white flex items-center justify-center text-xl font-black shrink-0">
                {initial}
              </div>
              <button onClick={signOut} className="td-btn-ghost px-4 py-2.5 rounded-full text-[13px] font-semibold flex items-center gap-1.5 shrink-0">
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>
            <div className="relative z-10 min-w-0">
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase opacity-60">Your account</p>
              <h1 className="text-2xl sm:text-[2rem] font-extrabold tracking-tight leading-tight mt-0.5 break-words">
                {fullName || "Profile & Settings"}
              </h1>
              <p className="text-sm mt-0.5 opacity-70 truncate">{email}</p>
            </div>
          </div>

          {/* Quick links — a real settings hub, not just a form */}
          {[
            { label: "My unlocks", desc: "Orders & receipts", icon: Receipt, to: "/purchases", cls: "td-bento-deep", chip: "bg-white/15" },
            { label: "My Library", desc: "Subjects you own", icon: LibraryBig, to: "/library", cls: "td-bento-ink td-force-dark", chip: "bg-white/10" },
            { label: "What's new", desc: "Latest features", icon: Sparkles, to: "/whats-new", cls: "td-surface", chip: "td-accent-bg" },
          ].map((q, i) => (
            <button key={q.to} onClick={() => navigate(q.to)}
              className={`td-bento ${q.cls} td-card-click p-4 sm:p-5 flex flex-col items-start justify-between gap-4 text-left min-h-[112px] ${i === 2 ? "col-span-2 lg:col-span-6" : "col-span-1 lg:col-span-3"}`}>
              <span className="w-full flex items-center justify-between">
                <span className={`w-9 h-9 rounded-full flex items-center justify-center ${q.chip}`}><q.icon className="w-4 h-4" /></span>
                <ArrowUpRight className="w-4 h-4 opacity-60" />
              </span>
              <span className="min-w-0">
                <span className={`block text-[15px] font-bold truncate ${q.cls === "td-surface" ? "text-white" : ""}`}>{q.label}</span>
                <span className={`block text-[11px] truncate ${q.cls === "td-surface" ? "text-zinc-500" : "opacity-65"}`}>{q.desc}</span>
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Two columns on desktop so the form doesn't run as one long strip */}
          <div className="grid lg:grid-cols-2 gap-5 items-start">
            {/* Account */}
            <div className={cardCls}>
              <div>
                <p className={sectionCls}>Account</p>
                <p className="text-zinc-600 text-xs mt-1">How your name shows up around TeamDino.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className={labelCls}>Email</Label>
                <div className="relative">
                  <Mail className={iconCls} />
                  <input id="email" value={email} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
                </div>
                <p className="text-zinc-600 text-[11px] pl-1">Your sign-in address — this can't be changed.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fullName" className={labelCls}>Full name</Label>
                <div className="relative">
                  <User className={iconCls} />
                  <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className={inputCls} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="username" className={labelCls}>Username</Label>
                <div className="relative">
                  <AtSign className={iconCls} />
                  <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className={inputCls} />
                </div>
                <p className="text-zinc-600 text-[11px] pl-1">Lowercase, no spaces — we'll tidy it up when you save.</p>
              </div>
            </div>

            {/* Academic */}
            <div className={cardCls}>
              <div>
                <p className={sectionCls}>Academic info</p>
                <p className="text-zinc-600 text-xs mt-1">This decides which subjects and full-year pack you see.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="department" className={labelCls}>Department</Label>
                <div className="relative">
                  <BookOpen className={iconCls} />
                  <Select value={department} onValueChange={setDepartment} required>
                    <SelectTrigger id="department" className="td-surface-2 td-field-focus border-0 text-white h-12 pl-10 rounded-xl">
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent className="td-glass border-white/10 text-white rounded-2xl shadow-xl">
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept} className="focus:bg-white/10 focus:text-white rounded-xl cursor-pointer py-2.5">{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="semester" className={labelCls}>Academic year</Label>
                <div className="relative">
                  <GraduationCap className={iconCls} />
                  <Select value={semester} onValueChange={setSemester} required>
                    <SelectTrigger id="semester" className="td-surface-2 td-field-focus border-0 text-white h-12 pl-10 rounded-xl">
                      <SelectValue placeholder="Select your year" />
                    </SelectTrigger>
                    <SelectContent className="td-glass border-white/10 text-white rounded-2xl shadow-xl">
                      {yearOptions.map((s) => (
                        <SelectItem key={s} value={s} className="focus:bg-white/10 focus:text-white rounded-xl cursor-pointer py-2.5">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {closedYear && (
                  <p className="text-[11px] pl-1 td-accent-text">
                    {closedYear} is closed right now, so you're seeing {semester} across the app. No need to save — you'll go back to {closedYear} automatically when it reopens. Save only if you want to switch for good.
                  </p>
                )}
              </div>

              <div className="td-surface-2 rounded-2xl p-3.5 flex gap-2.5">
                <GraduationCap className="w-4 h-4 td-accent-text shrink-0 mt-0.5" />
                <p className="text-zinc-400 text-xs leading-relaxed">
                  The Store and Dashboard show <span className="text-white font-medium">only your year</span> — keep this current so you
                  don't miss your subjects.
                </p>
              </div>
            </div>
          </div>

          {/* Save bar — sticks to the bottom and only lights up when there's something to save */}
          <div className="sticky bottom-4 mt-5 z-20">
            <div className="td-glass rounded-2xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm flex items-center gap-2 min-w-0">
                {dirty ? (
                  <><span className="w-2 h-2 rounded-full td-accent-solid shrink-0" /> <span className="text-white font-medium">Unsaved changes</span></>
                ) : (
                  <><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-zinc-400">Everything's saved</span></>
                )}
              </p>
              <button
                type="submit"
                disabled={!canSave}
                className="td-btn-primary h-11 px-6 rounded-full text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {isSaving ? "Saving…" : <>Save changes <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
