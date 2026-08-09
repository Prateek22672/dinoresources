import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BookOpen, GraduationCap, ArrowRight, User, AtSign, Mail, LogOut, Receipt, LibraryBig, Sparkles } from "lucide-react";
import AppShell from "@/components/layout/AppShell";

const DEPARTMENTS = ["CSE", "ECE", "Mechanical Engineering"];
const academicOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Supplementary"];

interface ProfileSetupProps {
  onProfileUpdated?: () => void;
}

export default function ProfileSetup({ onProfileUpdated }: ProfileSetupProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");

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
      setDepartment(d.department || "");
      setSemester(d.semester?.toString() || "");
      setFullName(d.full_name || "");
      setUsername(d.username || "");
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not authenticated"); setIsSaving(false); return; }

    const { error } = await supabase
      .from("profiles")
      .update({
        department,
        semester,
        full_name: fullName.trim() || null,
        username: username.trim().toLowerCase().replace(/\s+/g, "") || null,
      } as any)
      .eq("id", user.id);

    setIsSaving(false);
    if (error) {
      toast.error(error.message ?? "Failed to update profile");
    } else {
      toast.success("Profile updated!");
      onProfileUpdated?.();
      navigate("/");
    }
  };

  const signOut = async () => { await supabase.auth.signOut(); navigate("/auth"); };

  const initial = (fullName || username || email || "?").trim().charAt(0).toUpperCase();

  const iconCls = "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 z-10";
  const inputCls =
    "w-full h-12 td-surface-2 rounded-xl pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 td-field-focus";

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-2xl space-y-4">
          <div className="h-24 rounded-3xl td-surface animate-pulse" />
          <div className="h-64 rounded-3xl td-surface animate-pulse" />
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

      <div className="max-w-2xl">
        {/* Identity hero — accent glow, like the rest of the app */}
        <div className="td-hero relative overflow-hidden rounded-[28px] p-6 sm:p-7 mb-6">
          <div aria-hidden className="absolute -top-16 -left-12 w-64 h-56 opacity-50 pointer-events-none"
            style={{ background: "rgb(var(--td-accent-rgb) / 0.24)", borderRadius: "52% 48% 60% 40% / 55% 45% 55% 45%", filter: "blur(6px)" }} />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 rounded-[22px] td-accent-solid text-white flex items-center justify-center text-2xl font-black shrink-0">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="td-accent-text text-[11px] font-bold tracking-[0.18em] uppercase">Your account</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight mt-0.5">{fullName || "Profile & Settings"}</h1>
              <p className="text-zinc-400 text-sm mt-0.5 truncate">{email}</p>
            </div>
            <button onClick={signOut} className="td-btn-ghost px-4 py-2.5 rounded-full text-[13px] font-medium flex items-center gap-1.5 text-red-400 hover:text-red-300 shrink-0">
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        {/* Quick links — a real settings hub, not just a form */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
          {[
            { label: "My unlocks", icon: Receipt, to: "/purchases" },
            { label: "My Library", icon: LibraryBig, to: "/library" },
            { label: "What's new", icon: Sparkles, to: "/whats-new" },
          ].map((q) => (
            <button key={q.to} onClick={() => navigate(q.to)}
              className="td-surface td-card-click rounded-2xl p-3.5 flex flex-col items-start gap-2 text-left">
              <span className="w-9 h-9 rounded-xl td-accent-bg flex items-center justify-center"><q.icon className="w-4 h-4" /></span>
              <span className="text-white text-[13px] font-semibold">{q.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Account */}
          <div className="td-surface rounded-[28px] p-6 sm:p-7 space-y-4">
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-zinc-500">Account</p>

            <div className="relative">
              <Mail className={iconCls} />
              <input value={email} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
            </div>
            <div className="relative">
              <User className={iconCls} />
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className={inputCls} />
            </div>
            <div className="relative">
              <AtSign className={iconCls} />
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className={inputCls} />
            </div>
          </div>

          {/* Academic */}
          <div className="td-surface rounded-[28px] p-6 sm:p-7 space-y-4">
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-zinc-500">Academic info</p>

            <div className="space-y-1.5">
              <Label htmlFor="department" className="text-zinc-400 text-xs font-medium pl-1">Department</Label>
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
              <Label htmlFor="semester" className="text-zinc-400 text-xs font-medium pl-1">Academic year</Label>
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
            <p className="text-zinc-600 text-xs pl-1">The Store opens on your year by default — keep this current.</p>
          </div>

          <button
            type="submit"
            disabled={isSaving || !department || !semester}
            className="td-btn-primary w-full h-12 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSaving ? "Saving…" : <>Save changes <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
