import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

// Refactored Components
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { DashboardNav } from "./dashboard/DashboardNav";
import { SubjectGrid } from "./dashboard/SubjectGrid";

// Existing Sections/Modals
import UploadResourceDialog from "./UploadResourceDialog";
import AddSubjectDialog from "./AddSubjectDialog";
import SubjectDrawer from "./SubjectDrawer";
import SubjectDrawerAi from "./ai/SubjectDrawerAi";
import { AnnouncementsSection } from "./AnnouncementsSection";
import AttendanceCalculator from "./AttendanceCalculator";
import SGPACalculator from "./SGPACalculator";
import Footer from "./Footer";
import dinoLogo from "@/assets/dinosaurWhite.png";

type TabType = "subjects" | "ai_subjects" | "attendance" | "sgpa" | "announcements" | "support";

export default function Dashboard() {
  const navigate = useNavigate();
  const { isContributor, userId, role, isLoading: roleLoading } = useUserRole();
  const [profile, setProfile] = useState<{ department: string; semester: number; full_name?: string } | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isAddSubjectDialogOpen, setIsAddSubjectDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("subjects");

  const contentAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (profile) {
      loadSubjects();
      checkLatestAnnouncement();
    }
  }, [profile]);

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
    setTimeout(() => contentAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const checkLatestAnnouncement = async () => {
    try {
      const { data, error } = await supabase.from("announcements").select("id, title").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error || !data) return;

      const lastSeenId = localStorage.getItem("last_seen_announcement");
      if (lastSeenId !== data.id) {
        toast("New Update 📢", {
          description: data.title,
          position: "bottom-right",
          duration: 10000,
          action: { label: "Check out now", onClick: () => handleTabClick("announcements") },
        });
        localStorage.setItem("last_seen_announcement", data.id);
      }
    } catch (err) {
      console.error("Error fetching announcement:", err);
    }
  };

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) return navigate("/auth");

      const { data: profileData, error: profileError } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      if (profileError) return navigate("/auth");
      if (!profileData?.department || !profileData?.semester) return navigate("/setup");

      setProfile({ department: profileData.department, semester: profileData.semester, full_name: " " });
      setIsLoading(false);
    } catch (err) {
      navigate("/auth");
    }
  };

  const loadSubjects = async () => {
    if (!profile) return;
    const { data } = await supabase.from("subjects").select("*").eq("department", profile.department).eq("semester", profile.semester).order("order_index", { ascending: true });
    setSubjects(data || []);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (isLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-zinc-900 flex items-center justify-center shadow-2xl mx-auto animate-pulse border border-white/10">
            <img src={dinoLogo} alt="Loading" className="w-10 h-10 opacity-50" />
          </div>
          <p className="text-zinc-500 font-medium tracking-wide">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const filteredSubjects = subjects.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const firstName = profile?.full_name?.trim() ? profile.full_name.split(" ")[0] : "Buddy";

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-white/20 flex flex-col">
      
      <DashboardHeader 
        profile={profile} activeTab={activeTab} searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} handleTabClick={handleTabClick} handleSignOut={handleSignOut} 
      />

      <main className="container mx-auto px-4 py-8 space-y-12 flex-1">
        
        <DashboardNav firstName={firstName} activeTab={activeTab} handleTabClick={handleTabClick} />

        <div ref={contentAreaRef} className="bg-[#121214] border border-white/5 rounded-[40px] p-6 sm:p-10 min-h-[500px] scroll-mt-24 transition-all duration-500 animate-in slide-in-from-bottom-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* TAB RENDERER */}
          {(activeTab === "subjects" || activeTab === "ai_subjects") && (
            <SubjectGrid 
              activeTab={activeTab} isContributor={isContributor} searchQuery={searchQuery} 
              filteredSubjects={filteredSubjects} setIsAddSubjectDialogOpen={setIsAddSubjectDialogOpen} 
              setIsUploadDialogOpen={setIsUploadDialogOpen} handleSubjectClick={(sub) => { setSelectedSubject(sub); setIsDrawerOpen(true); }} 
            />
          )}
          
          {activeTab === "attendance" && (
            <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
              <div className="mb-8"><h2 className="text-2xl font-bold text-white">Attendance Calculator</h2><p className="text-zinc-400 mt-2">Only for 2nd/3rd Year Students.</p></div>
              <div className="bg-[#09090b] rounded-[32px] p-6 border border-white/5"><AttendanceCalculator /></div>
            </div>
          )}

          {activeTab === "sgpa" && (
            <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
              <div className="mb-8"><h2 className="text-2xl font-bold text-white">SGPA Calculator</h2><p className="text-zinc-400 mt-2">Estimate semester grades.</p></div>
              <div className="bg-[#09090b] rounded-[32px] p-6 border border-white/5"><SGPACalculator /></div>
            </div>
          )}

          {activeTab === "announcements" && (
            <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
              <div className="mb-8"><h2 className="text-2xl font-bold text-white">Announcements</h2><p className="text-zinc-400 mt-2">Latest updates.</p></div>
              <div className="bg-[#09090b] rounded-[32px] p-6 border border-white/5"><AnnouncementsSection isAdmin={role === "admin"} /></div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* DRAWERS & DIALOGS */}
      {selectedSubject && activeTab === "subjects" && <SubjectDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} subjectId={selectedSubject.id} subjectName={selectedSubject.name} userRole={role} userId={userId} />}
      {selectedSubject && activeTab === "ai_subjects" && <SubjectDrawerAi open={isDrawerOpen} onOpenChange={setIsDrawerOpen} subjectId={selectedSubject.id} subjectName={selectedSubject.name} userRole={role} userId={userId} />}
      {isContributor && subjects.length > 0 && <UploadResourceDialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen} subjects={subjects} onResourceUploaded={() => setIsUploadDialogOpen(false)} />}
      {isContributor && profile && <AddSubjectDialog open={isAddSubjectDialogOpen} onOpenChange={setIsAddSubjectDialogOpen} currentDepartment={profile.department} currentSemester={profile.semester} onSubjectAdded={loadSubjects} />}
    </div>
  );
}