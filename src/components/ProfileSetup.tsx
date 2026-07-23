import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BookOpen, GraduationCap, ArrowRight, ChevronLeft, User, AtSign, Mail, LogOut } from "lucide-react";
import dinoLogo from "@/assets/dinosaurBlack.png";
import Footer from "./Footer";

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

  const fieldWrap = "relative";
  const iconCls = "absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 z-10";
  const inputCls =
    "w-full h-13 bg-[#0a0a0c] border border-white/10 text-white rounded-2xl pl-12 pr-4 text-sm outline-none " +
    "placeholder:text-zinc-600 transition-shadow td-auth-field";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0b0e] flex items-center justify-center">
        <div className="w-16 h-16 rounded-[24px] bg-white flex items-center justify-center shadow-2xl animate-pulse border border-white/10">
          <img src={dinoLogo} alt="Team Dino" className="w-10 h-10 opacity-50" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-zinc-100 font-sans selection:bg-white/20 flex flex-col relative overflow-hidden">
      <style>{`
        .td-auth-field:focus, .td-auth-field:focus-within {
          border-color: rgb(var(--td-accent-rgb) / 0.55) !important;
          box-shadow: 0 0 0 3px rgb(var(--td-accent-rgb) / 0.16);
        }
        .h-13 { height: 3.25rem; }
      `}</style>

      {/* Ambient accent glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: "rgb(var(--td-accent-rgb) / 0.10)" }} />

      {/* Header */}
      <header className="border-b border-white/5 bg-[#0b0b0e]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}
              className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full h-10 w-10 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-white/10 shadow-lg">
                <img src={dinoLogo} alt="Team Dino" className="w-6 h-6" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white hidden sm:block">Team Dino</h1>
            </div>
          </div>
          <button onClick={signOut} className="td-btn-ghost px-4 py-2 rounded-full text-[13px] font-medium flex items-center gap-1.5 text-red-400 hover:text-red-300">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-[440px] space-y-6 animate-in fade-in zoom-in-95 duration-500 my-10">

          {/* Identity header */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-[26px] flex items-center justify-center text-3xl font-black text-white mb-4"
              style={{ background: "linear-gradient(135deg, var(--td-accent-soft), var(--td-accent))" }}>
              {initial}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Profile &amp; Settings</h1>
            <p className="text-zinc-500 mt-1.5 text-sm">Your account and academic details, in sync.</p>
          </div>

          {/* Account card */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[#121214] border border-white/[0.06] rounded-[28px] p-6 sm:p-7 shadow-2xl space-y-4">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-zinc-500">Account</p>

              <div className={fieldWrap}>
                <Mail className={iconCls} />
                <input value={email} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
              </div>
              <div className={fieldWrap}>
                <User className={iconCls} />
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className={inputCls} />
              </div>
              <div className={fieldWrap}>
                <AtSign className={iconCls} />
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className={inputCls} />
              </div>
            </div>

            {/* Academic card */}
            <div className="bg-[#121214] border border-white/[0.06] rounded-[28px] p-6 sm:p-7 shadow-2xl space-y-4">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-zinc-500">Academic info</p>

              <div className="space-y-2">
                <Label htmlFor="department" className="text-zinc-400 font-medium pl-1">Department</Label>
                <div className="relative">
                  <BookOpen className={iconCls} />
                  <Select value={department} onValueChange={setDepartment} required>
                    <SelectTrigger id="department" className="td-auth-field bg-[#0a0a0c] border-white/10 text-white h-13 pl-12 rounded-2xl">
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121214] border-white/10 text-white rounded-2xl shadow-xl">
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept} className="focus:bg-white/10 focus:text-white rounded-xl cursor-pointer py-3">{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester" className="text-zinc-400 font-medium pl-1">Academic year</Label>
                <div className="relative">
                  <GraduationCap className={iconCls} />
                  <Select value={semester} onValueChange={setSemester} required>
                    <SelectTrigger id="semester" className="td-auth-field bg-[#0a0a0c] border-white/10 text-white h-13 pl-12 rounded-2xl">
                      <SelectValue placeholder="Select your year" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121214] border-white/10 text-white rounded-2xl shadow-xl">
                      {academicOptions.map((s) => (
                        <SelectItem key={s} value={s} className="focus:bg-white/10 focus:text-white rounded-xl cursor-pointer py-3">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-zinc-600 text-xs pl-1">The Store opens on your year by default — keep this current.</p>
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-zinc-200 h-13 rounded-full font-bold text-base shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)] transition-all hover:scale-[1.02]"
              disabled={isSaving || !department || !semester}
            >
              {isSaving ? "Saving…" : "Save changes"}
              {!isSaving && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
