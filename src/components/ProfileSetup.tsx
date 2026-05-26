import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BookOpen, GraduationCap, ArrowRight, ChevronLeft } from "lucide-react";
import dinoLogo from "@/assets/dinosaurBlack.png";
import Footer from "./Footer";

const DEPARTMENTS = ["CSE", "ECE", "Mechanical Engineering"];
const academicOptions = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "Supplementary"
]

interface ProfileSetupProps {
  onProfileUpdated?: () => void;
}

export default function ProfileSetup({ onProfileUpdated }: ProfileSetupProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");

  useEffect(() => {
    loadCurrentProfile();
  }, []);

  const loadCurrentProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("department, semester")
      .eq("id", user.id)
      .single();

    if (data) {
      setDepartment(data.department || "");
      setSemester(data.semester?.toString() || "");
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Not authenticated");
      setIsSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        department,
        semester: semester,
      })
      .eq("id", user.id);

    setIsSaving(false);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully!");
      onProfileUpdated?.();
      navigate("/");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-16 h-16 rounded-[24px] bg-white flex items-center justify-center shadow-2xl animate-pulse border border-white/10">
          <img src={dinoLogo} alt="Team Dino" className="w-10 h-10 opacity-50" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-white/20 flex flex-col relative overflow-hidden">
      
      {/* Premium Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Sleek Header with Back Button */}
      <header className="border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full h-10 w-10 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-white/10 shadow-lg">
                <img src={dinoLogo} alt="Team Dino" className="w-6 h-6" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white hidden sm:block">Team Dino</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-[420px] space-y-8 animate-in fade-in zoom-in-95 duration-500 my-10">
          
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-[24px] bg-white flex items-center justify-center border border-white/10 shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)] relative group cursor-default">
                <div className="absolute inset-0 bg-white rounded-[24px] opacity-0 group-hover:opacity-50 transition-opacity" />
                <img src={dinoLogo} alt="Team Dino Logo" className="w-12 h-12" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Update Academic Info</h1>
            <p className="text-zinc-400 font-medium">Keep your workspace in sync with your semester.</p>
          </div>

          {/* Main Card */}
          <div className="bg-[#121214] border border-white/5 rounded-[40px] p-6 sm:p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Department Field */}
              <div className="space-y-2 relative">
                <Label htmlFor="department" className="text-zinc-400 font-medium pl-1">Department</Label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 z-10" />
                  <Select value={department} onValueChange={setDepartment} required>
                    <SelectTrigger id="department" className="bg-[#0a0a0c] border-white/10 text-white h-14 pl-12 rounded-2xl focus:ring-indigo-500/50 transition-all">
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121214] border-white/10 text-white rounded-2xl shadow-xl">
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept} className="focus:bg-white/10 focus:text-white rounded-xl cursor-pointer py-3">
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Semester Field */}
              <div className="space-y-2 relative">
                <Label htmlFor="semester" className="text-zinc-400 font-medium pl-1">Academic Year</Label>
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 z-10" />
                  <Select value={semester} onValueChange={setSemester} required>
                    <SelectTrigger id="semester" className="bg-[#0a0a0c] border-white/10 text-white h-14 pl-12 rounded-2xl focus:ring-indigo-500/50 transition-all">
                      <SelectValue placeholder="Select your semester" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121214] border-white/10 text-white rounded-2xl shadow-xl">
                      {academicOptions.map((s) => (
                        <SelectItem key={s} value={s} className="focus:bg-white/10 focus:text-white rounded-xl cursor-pointer py-3">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-white text-black hover:bg-zinc-200 h-14 rounded-full font-bold text-base mt-8 shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)] transition-all hover:scale-[1.02]" 
                disabled={isSaving || !department || !semester}
              >
                {isSaving ? "Saving Updates..." : "Save Academic Info"}
                {!isSaving && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>

            </form>
          </div>
        </div>
      </main>

      {/* Shared Footer */}
      <Footer />
      
    </div>
  );
}