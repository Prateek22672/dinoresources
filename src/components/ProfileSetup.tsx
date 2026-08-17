import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BookOpen, GraduationCap, ArrowRight, User, AtSign, Mail, LogOut, Receipt, LibraryBig, Sparkles, Check } from "lucide-react";
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
  const cardCls = "td-surface rounded-[28px] p-6 sm:p-7 space-y-4";
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
        {/* Identity hero — accent glow, like the rest of the app */}
        <div className="td-hero td-in relative overflow-hidden rounded-[28px] p-6 sm:p-7 mb-5">
          <div aria-hidden className="absolute -top-16 -left-12 w-64 h-56 opacity-50 pointer-events-none"
            style={{ background: "rgb(var(--td-accent-rgb) / 0.24)", borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%", filter: "blur(6px)" }} />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 rounded-[22px] td-accent-solid text-white flex items-center justify-center text-2xl font-black shrink-0">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="td-accent-text text-[11px] font-bold tracking-[0.18em] uppercase">Your account</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight mt-0.5 truncate">
                {fullName || "Profile & Settings"}
              </h1>
              <p className="text-zinc-400 text-sm mt-0.5 truncate">{email}</p>
            </div>
            <button onClick={signOut} className="td-btn-ghost px-4 py-2.5 rounded-full text-[13px] font-medium flex items-center gap-1.5 text-red-400 hover:text-red-300 shrink-0">
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        {/* Quick links — a real settings hub, not just a form */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
          {[
            { label: "My unlocks", desc: "Orders & receipts", icon: Receipt, to: "/purchases" },
            { label: "My Library", desc: "Subjects you own", icon: LibraryBig, to: "/library" },
            { label: "What's new", desc: "Latest features", icon: Sparkles, to: "/whats-new" },
          ].map((q) => (
            <button key={q.to} onClick={() => navigate(q.to)}
              className="td-surface td-card-click rounded-2xl p-3.5 flex flex-col items-start gap-2 text-left">
              <span className="w-9 h-9 rounded-xl td-accent-bg flex items-center justify-center"><q.icon className="w-4 h-4" /></span>
              <span className="min-w-0">
                <span className="block text-white text-[13px] font-semibold truncate">{q.label}</span>
                <span className="block text-zinc-500 text-[11px] truncate">{q.desc}</span>
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
                      {academicOptions.map((s) => (
                        <SelectItem key={s} value={s} className="focus:bg-white/10 focus:text-white rounded-xl cursor-pointer py-2.5">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
